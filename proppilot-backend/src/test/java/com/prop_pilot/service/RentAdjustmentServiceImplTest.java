package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResult;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.impl.RentAdjustmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentAdjustmentServiceImplTest {

    @Mock
    private IndexValueRepository indexValueRepository;

    @Mock
    private Clock clock;

    @InjectMocks
    private RentAdjustmentServiceImpl rentAdjustmentService;

    // ---- helpers ----

    private Lease buildLease(long id, Lease.AdjustmentIndex index, int freqMonths,
                             LocalDate startDate, LocalDate endDate, BigDecimal monthlyRent) {
        Lease lease = new Lease();
        lease.setId(id);
        lease.setAdjustmentIndex(index);
        lease.setAdjustmentFrequencyMonths(freqMonths);
        lease.setStartDate(startDate);
        lease.setEndDate(endDate);
        lease.setMonthlyRent(monthlyRent);
        lease.setCountryCode("AR");
        return lease;
    }

    private IndexValue buildIndexValue(String indexType, String countryCode, LocalDate date, BigDecimal value) {
        // Use reflection-free approach: rely on the entity's setters... but IndexValue has none.
        // We test via the service which accepts the Optional<IndexValue> from the mock.
        // Build a real IndexValue instance via a helper that sets fields reflectively.
        try {
            IndexValue iv = new IndexValue();
            setField(iv, "indexType", indexType);
            setField(iv, "countryCode", countryCode);
            setField(iv, "valueDate", date);
            setField(iv, "value", value);
            return iv;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private void fixClockAt(LocalDate date) {
        Instant instant = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        when(clock.instant()).thenReturn(instant);
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());
    }

    // ---- Test cases ----

    /**
     * Case 1: adjustmentIndex == NONE
     * hasAdjustment=false, adjustedRent=baseRent, unavailableReason="INDEX_TYPE_NONE",
     * repository is never called.
     */
    @Test
    void computeAdjustedRent_whenNone_returnsBaseRentAndNeverCallsRepo() {
        Lease lease = buildLease(1L, Lease.AdjustmentIndex.NONE, 12,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("320000.00"));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertFalse(result.hasAdjustment());
        assertEquals(new BigDecimal("320000.00"), result.adjustedRent());
        assertEquals("INDEX_TYPE_NONE", result.unavailableReason());
        assertNull(result.adjustmentFactor());
        verify(indexValueRepository, never()).findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                any(), any(), any());
    }

    /**
     * Case 2: Happy path — after first milestone, exact month data available.
     * Lease: startDate=2025-01-01, freq=6 months, baseRent=320000, ICL
     * Today=2026-01-15 => monthsSinceStart=12, milestoneN=2, lastMilestone=2026-01-01
     * base ICL @ 2025-01-01 = 877.42 (seed: 2024-12-01 closest on-or-before)
     * Wait - startDate=2025-01-01, base ICL on-or-before 2025-01-01 = 890.15 (seed 2025-01-01)
     * current ICL on-or-before 2026-01-01 = 1094.20 (seed 2026-01-01)
     * factor = 1094.20 / 890.15 = 1.229224...
     * adjustedRent = 320000 * factor (HALF_UP 2dp)
     */
    @Test
    void computeAdjustedRent_happyPath_afterFirstMilestone_correctFactorAndRent() {
        // Today = 2026-01-15: 12 months since start, milestone at 2026-01-01 (N=2 × 6 months)
        fixClockAt(LocalDate.of(2026, 1, 15));

        Lease lease = buildLease(1L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("320000.00"));

        IndexValue baseIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("890.15"));
        IndexValue currentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2026, 1, 1), new BigDecimal("1094.20"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                .thenReturn(Optional.of(baseIndex));
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2026, 1, 1))))
                .thenReturn(Optional.of(currentIndex));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertTrue(result.hasAdjustment());
        // factor = 1094.20 / 890.15 with 6dp scale = 1.229224 (approx)
        BigDecimal expectedFactor = new BigDecimal("1094.20").divide(new BigDecimal("890.15"), 6, java.math.RoundingMode.HALF_UP);
        BigDecimal expectedRent = new BigDecimal("320000.00").multiply(expectedFactor).setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(expectedRent, result.adjustedRent());
        assertEquals(expectedFactor, result.adjustmentFactor());
        assertEquals(LocalDate.of(2026, 1, 1), result.indexReferenceDate());
        assertEquals(LocalDate.of(2025, 1, 1), result.baseIndexDate());
        assertNull(result.unavailableReason());
    }

    /**
     * Case 3: Before first milestone (today < startDate + freq)
     * adjustedRent=baseRent, adjustmentFactor=1.0, indexReferenceDate=leaseStartDate
     */
    @Test
    void computeAdjustedRent_beforeFirstMilestone_returnsBaseRentWithFactorOne() {
        // Today = 2025-04-01, lease started 2025-01-01, freq=6 months
        // monthsSinceStart=3, first milestone would be at 2025-07-01 (not reached yet)
        fixClockAt(LocalDate.of(2025, 4, 1));

        Lease lease = buildLease(1L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("320000.00"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertTrue(result.hasAdjustment());
        assertEquals(new BigDecimal("320000.00"), result.adjustedRent());
        assertEquals(new BigDecimal("1.000000"), result.adjustmentFactor());
        assertEquals(lease.getStartDate(), result.indexReferenceDate());
        assertNull(result.unavailableReason());
    }

    /**
     * Case 4: Milestone month has no exact data — falls back to last on-or-before.
     * indexReferenceDate should reflect the actual fallback date, not the milestone date.
     */
    @Test
    void computeAdjustedRent_milestoneMonthMissingData_fallsBackToLastAvailable() {
        // Today = 2025-09-15, lease started 2025-01-01, freq=6 months
        // monthsSinceStart=8, milestoneN=1, lastMilestone=2025-07-01
        // Suppose 2025-07-01 row is missing; last available is 2025-06-01 (967.20)
        fixClockAt(LocalDate.of(2025, 9, 15));

        Lease lease = buildLease(2L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("320000.00"));

        IndexValue baseIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("890.15"));
        // fallback: returned row date is 2025-06-01, not 2025-07-01
        IndexValue fallbackCurrentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 6, 1), new BigDecimal("967.20"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                .thenReturn(Optional.of(baseIndex));
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 7, 1))))
                .thenReturn(Optional.of(fallbackCurrentIndex));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertTrue(result.hasAdjustment());
        // indexReferenceDate = actual row date = 2025-06-01 (fallback)
        assertEquals(LocalDate.of(2025, 6, 1), result.indexReferenceDate());
        assertNull(result.unavailableReason());
    }

    /**
     * Case 5: Start date month has no exact data — falls back to last on-or-before for base.
     * baseIndexDate should reflect the actual fallback date.
     */
    @Test
    void computeAdjustedRent_startDateMissingData_fallsBackForBaseline() {
        // Today = 2025-09-15, lease started 2025-01-15 (mid-month, no exact row)
        // base fallback = 2024-12-01 (877.42)
        fixClockAt(LocalDate.of(2025, 9, 15));

        Lease lease = buildLease(3L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 15), LocalDate.of(2026, 12, 31),
                new BigDecimal("300000.00"));

        // base fallback: no 2025-01-15 row, returns the 2024-12-01 row
        IndexValue baseFallback = buildIndexValue("ICL", "AR", LocalDate.of(2024, 12, 1), new BigDecimal("877.42"));
        // lastMilestone: months between 2025-01-15 and 2025-09-15 = 8, N=1, milestone = 2025-07-15
        IndexValue currentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 7, 1), new BigDecimal("985.44"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 15))))
                .thenReturn(Optional.of(baseFallback));
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 7, 15))))
                .thenReturn(Optional.of(currentIndex));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertTrue(result.hasAdjustment());
        // baseIndexDate = actual row date = 2024-12-01 (fallback)
        assertEquals(LocalDate.of(2024, 12, 1), result.baseIndexDate());
        assertNull(result.unavailableReason());
    }

    /**
     * Case 6: Repository returns empty for the entire indexType — NO_INDEX_DATA.
     */
    @Test
    void computeAdjustedRent_noIndexDataExists_returnsBaseRentWithReason() {
        Lease lease = buildLease(1L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("320000.00"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(false);

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertFalse(result.hasAdjustment());
        assertEquals(new BigDecimal("320000.00"), result.adjustedRent());
        assertEquals("NO_INDEX_DATA", result.unavailableReason());
        assertNull(result.adjustmentFactor());
    }

    /**
     * Case 7: DOLAR_BLUE — same ratio logic, no special-casing.
     */
    @Test
    void computeAdjustedRent_dolarBlue_usesRatioLikeAnyOtherIndex() {
        // Today = 2025-07-01, lease started 2025-01-01, freq=6 months
        // lastMilestone = 2025-07-01
        fixClockAt(LocalDate.of(2025, 7, 1));

        Lease lease = buildLease(5L, Lease.AdjustmentIndex.DOLAR_BLUE, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("500.00"));

        IndexValue baseIndex = buildIndexValue("DOLAR_BLUE", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("1000.00"));
        IndexValue currentIndex = buildIndexValue("DOLAR_BLUE", "AR", LocalDate.of(2025, 7, 1), new BigDecimal("1200.00"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("DOLAR_BLUE", "AR")).thenReturn(true);
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("DOLAR_BLUE"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                .thenReturn(Optional.of(baseIndex));
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("DOLAR_BLUE"), eq("AR"), eq(LocalDate.of(2025, 7, 1))))
                .thenReturn(Optional.of(currentIndex));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        assertTrue(result.hasAdjustment());
        // factor = 1200 / 1000 = 1.2
        BigDecimal expectedFactor = new BigDecimal("1200.00").divide(new BigDecimal("1000.00"), 6, java.math.RoundingMode.HALF_UP);
        BigDecimal expectedRent = new BigDecimal("500.00").multiply(expectedFactor).setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(expectedRent, result.adjustedRent()); // 600.00
        assertEquals(expectedFactor, result.adjustmentFactor());
        assertEquals("DOLAR_BLUE", result.adjustmentIndex());
    }

    /**
     * Case 8: Rounding — base=100000, factor results in 1.084041...
     * Result must be 108404.10 (HALF_UP 2dp), not 108404.09 or otherwise.
     * factor = 967.20 / 892.00 = 1.084305...
     * Let's use specific values: base=100000, baseValue=877.42, currentValue=951.21
     * factor = 951.21 / 877.42 = 1.084137... → adjustedRent = 108413.70
     * Use: base=100000, baseValue=877.42, currentValue=950.11
     * factor = 950.11 / 877.42 = 1.082929... not precise enough
     * Use explicit values that produce known rounding case:
     * base=100000, baseValue=1000.00, currentValue=1084.041 (not integer)
     * OR: base=100000, factor exactly = current/base where current/base × 100000 = 108404.105 (rounds to 108404.11)
     * Use: base=100000.00, baseValue=1000.000000, currentValue=1084.04150 (produces 1.084042 after 6dp)
     * Actually: let's use values from seed.
     * base=100000, baseValue=877.42, currentValue=950.11 (seed 2025-05-01)
     * factor = 950.11/877.42 = 1.082929... adjustedRent = 108292.9... → 108292.90
     * For a specific HALF_UP case: use currentValue=967.20 (seed 2025-06-01)
     * factor = 967.20/877.42 = 1.102344... × 100000 = 110234.4... → 110234.40
     * The plan says factor 1.084041 × 100000 = 108404.10 HALF_UP not 108404.09.
     * Construct: base=100000, baseValue=1000000, currentValue=1084041 → factor=1.084041/1 = 1.084041000000
     * adjustedRent = 100000 × 1.084041 = 108404.1 → HALF_UP → 108404.10
     * Simplify: base=1000000, baseValue=100, currentValue=108.404150 → factor=1.084042 (6dp) → rent = 1084042
     * Let's just do: base=100000, base=1000.000, current=1084.041
     * factor = 1084.041/1000.000 = 1.084041 (exact with 6dp)
     * adjustedRent = 100000 * 1.084041 = 108404.1 → with scale 2 HALF_UP = 108404.10 ✓
     */
    @Test
    void computeAdjustedRent_rounding_halfUpTwoDecimals() {
        // Today = 2025-07-01, lease started 2025-01-01, freq=6 months → milestone at 2025-07-01
        fixClockAt(LocalDate.of(2025, 7, 1));

        Lease lease = buildLease(8L, Lease.AdjustmentIndex.ICL, 6,
                LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("100000.00"));

        // factor = 1084.041 / 1000.000 = 1.084041 exactly
        IndexValue baseIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("1000.000000"));
        IndexValue currentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 7, 1), new BigDecimal("1084.041000"));

        when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                .thenReturn(Optional.of(baseIndex));
        when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 7, 1))))
                .thenReturn(Optional.of(currentIndex));

        AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);

        // 100000 * 1.084041 = 108404.1 → HALF_UP → 108404.10
        assertEquals(new BigDecimal("108404.10"), result.adjustedRent());
        // Verify scale is exactly 2
        assertEquals(2, result.adjustedRent().scale());
    }

    /**
     * Case 9: nextAdjustmentDate = lastMilestone + freq when within endDate,
     * and null when it would fall after endDate.
     */
    @Test
    void computeAdjustedRent_nextAdjustmentDate_nullWhenPastEndDate() {
        // Sub-case A: nextAdjustmentDate is within endDate
        {
            // Today = 2025-07-01, startDate=2025-01-01, freq=6, endDate=2026-12-31
            // lastMilestone=2025-07-01, next=2026-01-01 which is <= endDate → not null
            fixClockAt(LocalDate.of(2025, 7, 1));

            Lease lease = buildLease(1L, Lease.AdjustmentIndex.ICL, 6,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2026, 12, 31),
                    new BigDecimal("320000.00"));

            IndexValue baseIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("890.15"));
            IndexValue currentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 7, 1), new BigDecimal("967.20"));

            when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
            when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                    eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                    .thenReturn(Optional.of(baseIndex));
            when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                    eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 7, 1))))
                    .thenReturn(Optional.of(currentIndex));

            AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);
            assertEquals(LocalDate.of(2026, 1, 1), result.nextAdjustmentDate());
        }

        // Sub-case B: nextAdjustmentDate falls after endDate → null
        {
            // Today = 2025-07-01, startDate=2025-01-01, freq=6, endDate=2025-12-31
            // lastMilestone=2025-07-01, next=2026-01-01 which is > endDate → null
            fixClockAt(LocalDate.of(2025, 7, 1));

            Lease lease = buildLease(9L, Lease.AdjustmentIndex.ICL, 6,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                    new BigDecimal("200000.00"));

            IndexValue baseIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 1, 1), new BigDecimal("890.15"));
            IndexValue currentIndex = buildIndexValue("ICL", "AR", LocalDate.of(2025, 7, 1), new BigDecimal("967.20"));

            when(indexValueRepository.existsByIndexTypeAndCountryCode("ICL", "AR")).thenReturn(true);
            when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                    eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 1, 1))))
                    .thenReturn(Optional.of(baseIndex));
            when(indexValueRepository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                    eq("ICL"), eq("AR"), eq(LocalDate.of(2025, 7, 1))))
                    .thenReturn(Optional.of(currentIndex));

            AdjustedRentResult result = rentAdjustmentService.computeAdjustedRent(lease);
            assertNull(result.nextAdjustmentDate());
        }
    }
}
