package com.prop_pilot.service;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.external.ExternalIndexFetcher;
import com.prop_pilot.service.impl.IndexValueServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IndexValueServiceTest {

    @Mock
    private IndexValueRepository indexValueRepository;

    @Mock
    private CountryConfigService countryConfigService;

    private IndexValueServiceImpl indexValueService;

    private static final String COUNTRY_CODE = "AR";
    private static final LocalDate LEASE_START = LocalDate.of(2024, 1, 1);
    private static final LocalDate PAYMENT_DATE = LocalDate.of(2025, 1, 1);

    private IndexValue buildIndexValue(IndexType type, LocalDate date, String value) {
        return IndexValue.builder()
            .id(1L)
            .indexType(type)
            .countryCode(COUNTRY_CODE)
            .valueDate(date)
            .value(new BigDecimal(value))
            .source("test")
            .build();
    }

    @BeforeEach
    void setUp() {
        indexValueService = new IndexValueServiceImpl(
            indexValueRepository,
            countryConfigService,
            Collections.emptyList()
        );
    }

    // 1. calculateAdjustedRent with ICL index: known base + known index values
    @Test
    void calculateAdjustedRent_withIclIndex_returnsCorrectAmount() {
        BigDecimal baseRent = new BigDecimal("100000");
        IndexValue startValue = buildIndexValue(IndexType.ICL, LEASE_START, "1000.000000");
        IndexValue paymentValue = buildIndexValue(IndexType.ICL, PAYMENT_DATE, "1250.000000");

        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(LEASE_START)))
            .thenReturn(Optional.of(startValue));
        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(PAYMENT_DATE)))
            .thenReturn(Optional.of(paymentValue));

        BigDecimal result = indexValueService.calculateAdjustedRent(
            baseRent, COUNTRY_CODE, IndexType.ICL, LEASE_START, PAYMENT_DATE);

        // Expected: 100000 * (1250 / 1000) = 125000.00
        assertEquals(new BigDecimal("125000.00"), result);
    }

    // 2. calculateAdjustedRent with NONE index: should return base rent unchanged
    @Test
    void calculateAdjustedRent_withNoneIndex_returnsBaseRent() {
        BigDecimal baseRent = new BigDecimal("80000");

        BigDecimal result = indexValueService.calculateAdjustedRent(
            baseRent, COUNTRY_CODE, IndexType.NONE, LEASE_START, PAYMENT_DATE);

        assertEquals(baseRent, result);
    }

    // 3. calculateAdjustedRent when no index data exists: should return base rent (factor = 1)
    @Test
    void calculateAdjustedRent_whenNoIndexDataExists_returnsBaseRent() {
        BigDecimal baseRent = new BigDecimal("90000");

        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), any(LocalDate.class)))
            .thenReturn(Optional.empty());

        BigDecimal result = indexValueService.calculateAdjustedRent(
            baseRent, COUNTRY_CODE, IndexType.ICL, LEASE_START, PAYMENT_DATE);

        // Factor defaults to 1 when data is missing, so adjusted = base * 1 = base
        assertEquals(new BigDecimal("90000.00"), result);
    }

    // 4. calculateAdjustmentFactor: test with known values, verify ratio
    @Test
    void calculateAdjustmentFactor_withKnownValues_returnsCorrectRatio() {
        IndexValue fromValue = buildIndexValue(IndexType.ICL, LEASE_START, "800.000000");
        IndexValue toValue = buildIndexValue(IndexType.ICL, PAYMENT_DATE, "1200.000000");

        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(LEASE_START)))
            .thenReturn(Optional.of(fromValue));
        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(PAYMENT_DATE)))
            .thenReturn(Optional.of(toValue));

        BigDecimal factor = indexValueService.calculateAdjustmentFactor(
            COUNTRY_CODE, IndexType.ICL, LEASE_START, PAYMENT_DATE);

        // 1200 / 800 = 1.500000
        assertEquals(new BigDecimal("1.500000"), factor);
    }

    // 5. calculateAdjustmentFactor with same date: factor should be 1
    @Test
    void calculateAdjustmentFactor_withSameDate_returnsOne() {
        LocalDate sameDate = LocalDate.of(2024, 6, 1);
        IndexValue sameValue = buildIndexValue(IndexType.ICL, sameDate, "1100.000000");

        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(sameDate)))
            .thenReturn(Optional.of(sameValue));

        BigDecimal factor = indexValueService.calculateAdjustmentFactor(
            COUNTRY_CODE, IndexType.ICL, sameDate, sameDate);

        // 1100 / 1100 = 1.000000
        assertEquals(new BigDecimal("1.000000"), factor);
    }

    // 6. getClosestValue: finds the most recent value on or before the requested date
    @Test
    void getClosestValue_returnsValueOnOrBeforeRequestedDate() {
        LocalDate requestDate = LocalDate.of(2024, 6, 15);
        LocalDate closestDate = LocalDate.of(2024, 6, 1); // the closest earlier date
        IndexValue closest = buildIndexValue(IndexType.ICL, closestDate, "950.000000");

        when(indexValueRepository.findClosestValue(IndexType.ICL, COUNTRY_CODE, requestDate))
            .thenReturn(Optional.of(closest));

        Optional<IndexValue> result = indexValueService.getClosestValue(COUNTRY_CODE, IndexType.ICL, requestDate);

        assertEquals(true, result.isPresent());
        assertEquals(closestDate, result.get().getValueDate());
        assertEquals(new BigDecimal("950.000000"), result.get().getValue());
    }

    // 7. Edge case: future date with no data - should handle gracefully (returns base rent)
    @Test
    void calculateAdjustedRent_withFutureDateAndNoData_returnsBaseRentGracefully() {
        BigDecimal baseRent = new BigDecimal("120000");
        LocalDate futureDate = LocalDate.of(2099, 12, 31);

        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(LEASE_START)))
            .thenReturn(Optional.empty());
        when(indexValueRepository.findClosestValue(eq(IndexType.ICL), eq(COUNTRY_CODE), eq(futureDate)))
            .thenReturn(Optional.empty());

        BigDecimal result = indexValueService.calculateAdjustedRent(
            baseRent, COUNTRY_CODE, IndexType.ICL, LEASE_START, futureDate);

        // No data available: factor = 1, so adjusted = base rent
        assertEquals(new BigDecimal("120000.00"), result);
    }

    // 8. calculateAdjustedRent with null base rent: returns null
    @Test
    void calculateAdjustedRent_withNullBaseRent_returnsNull() {
        BigDecimal result = indexValueService.calculateAdjustedRent(
            null, COUNTRY_CODE, IndexType.ICL, LEASE_START, PAYMENT_DATE);

        assertNull(result);
    }

    // 9. calculateAdjustedRent with zero base rent: returns zero
    @Test
    void calculateAdjustedRent_withZeroBaseRent_returnsZero() {
        BigDecimal result = indexValueService.calculateAdjustedRent(
            BigDecimal.ZERO, COUNTRY_CODE, IndexType.ICL, LEASE_START, PAYMENT_DATE);

        assertEquals(BigDecimal.ZERO, result);
    }

    // 10. calculateAdjustmentFactor with NONE index: returns BigDecimal.ONE
    @Test
    void calculateAdjustmentFactor_withNoneIndex_returnsOne() {
        BigDecimal factor = indexValueService.calculateAdjustmentFactor(
            COUNTRY_CODE, IndexType.NONE, LEASE_START, PAYMENT_DATE);

        assertEquals(BigDecimal.ONE, factor);
    }
}
