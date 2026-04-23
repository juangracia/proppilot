package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.User;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.service.impl.RentAdjustmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RentAdjustmentServiceImplTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private IndexValueService indexValueService;

    @InjectMocks
    private RentAdjustmentServiceImpl service;

    private static final Long OWNER_ID = 7L;
    private static final Long LEASE_ID = 42L;
    private static final LocalDate TODAY = LocalDate.of(2026, 4, 23);

    private Lease buildLease(AdjustmentIndex idx, BigDecimal rent, LocalDate startDate) {
        Lease lease = new Lease();
        lease.setId(LEASE_ID);
        lease.setMonthlyRent(rent);
        lease.setAdjustmentIndex(idx);
        lease.setStartDate(startDate);
        lease.setCountryCode("AR");
        User u = new User();
        u.setId(OWNER_ID);
        lease.setOwner(u);
        return lease;
    }

    private IndexValue indexValue(String type, LocalDate period, String value) {
        IndexValue iv = new IndexValue();
        iv.setIndexType(type);
        iv.setCountryCode("AR");
        iv.setValueDate(period);
        iv.setValue(new BigDecimal(value));
        return iv;
    }

    @Test
    void computeAdjustedRent_withIclAndAvailableCurrentMonth_returnsMultipliedAmount() {
        Lease lease = buildLease(AdjustmentIndex.ICL, new BigDecimal("250000.00"), LocalDate.of(2025, 4, 1));
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(lease));
        when(indexValueService.findLatestOnOrBefore(AdjustmentIndex.ICL, "AR", LocalDate.of(2025, 4, 1)))
            .thenReturn(Optional.of(indexValue("ICL", LocalDate.of(2025, 4, 1), "100.000000")));
        when(indexValueService.findLatestOnOrBefore(AdjustmentIndex.ICL, "AR", TODAY))
            .thenReturn(Optional.of(indexValue("ICL", LocalDate.of(2026, 4, 1), "152.240000")));

        AdjustedRentResponse result = service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY);

        assertThat(result.hasAdjustment()).isTrue();
        assertThat(result.baseAmount()).isEqualByComparingTo("250000.00");
        assertThat(result.adjustedAmount()).isEqualByComparingTo("380600.00");
        assertThat(result.factor()).isEqualByComparingTo("1.5224");
        assertThat(result.indexType()).isEqualTo("ICL");
        assertThat(result.indexDate()).isEqualTo(LocalDate.of(2026, 4, 1));
        assertThat(result.leaseId()).isEqualTo(LEASE_ID);
    }

    @Test
    void computeAdjustedRent_fallsBackToPreviousMonthWhenCurrentMissing() {
        Lease lease = buildLease(AdjustmentIndex.ICL, new BigDecimal("100000.00"), LocalDate.of(2025, 1, 1));
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(lease));
        when(indexValueService.findLatestOnOrBefore(AdjustmentIndex.ICL, "AR", LocalDate.of(2025, 1, 1)))
            .thenReturn(Optional.of(indexValue("ICL", LocalDate.of(2025, 1, 1), "100.000000")));
        when(indexValueService.findLatestOnOrBefore(AdjustmentIndex.ICL, "AR", TODAY))
            .thenReturn(Optional.of(indexValue("ICL", LocalDate.of(2026, 3, 1), "140.000000")));

        AdjustedRentResponse result = service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY);

        assertThat(result.indexDate()).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(result.factor()).isEqualByComparingTo("1.4000");
        assertThat(result.adjustedAmount()).isEqualByComparingTo("140000.00");
    }

    @Test
    void computeAdjustedRent_withNoneIndex_returnsBaseAmountAndNoAdjustment() {
        Lease lease = buildLease(AdjustmentIndex.NONE, new BigDecimal("180000.00"), LocalDate.of(2025, 1, 1));
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(lease));

        AdjustedRentResponse result = service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY);

        assertThat(result.hasAdjustment()).isFalse();
        assertThat(result.baseAmount()).isEqualByComparingTo("180000.00");
        assertThat(result.adjustedAmount()).isEqualByComparingTo("180000.00");
        assertThat(result.factor()).isEqualByComparingTo("1.0000");
        assertThat(result.indexType()).isEqualTo("NONE");
        assertThat(result.indexDate()).isNull();
    }

    @Test
    void computeAdjustedRent_whenStartIndexMissing_returnsBaseWithNoAdjustment() {
        Lease lease = buildLease(AdjustmentIndex.ICL, new BigDecimal("200000.00"), LocalDate.of(2020, 1, 1));
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(lease));
        when(indexValueService.findLatestOnOrBefore(eq(AdjustmentIndex.ICL), eq("AR"), any()))
            .thenReturn(Optional.empty());

        AdjustedRentResponse result = service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY);

        assertThat(result.hasAdjustment()).isFalse();
        assertThat(result.adjustedAmount()).isEqualByComparingTo("200000.00");
        assertThat(result.factor()).isEqualByComparingTo("1.0000");
    }

    @Test
    void computeAdjustedRent_withDollarIndex_returnsBaseWithNoAdjustment() {
        Lease lease = buildLease(AdjustmentIndex.DOLAR_OFICIAL, new BigDecimal("500.00"), LocalDate.of(2025, 1, 1));
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(lease));

        AdjustedRentResponse result = service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY);

        assertThat(result.hasAdjustment()).isFalse();
        assertThat(result.adjustedAmount()).isEqualByComparingTo("500.00");
        assertThat(result.indexType()).isEqualTo("DOLAR_OFICIAL");
    }

    @Test
    void computeAdjustedRent_whenLeaseNotFound_throwsResourceNotFound() {
        when(leaseRepository.findByIdAndOwnerId(LEASE_ID, OWNER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.computeAdjustedRent(LEASE_ID, OWNER_ID, TODAY))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
