package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.dto.AgendaEvent;
import com.prop_pilot.dto.AgendaResponse;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.Lease.LeaseStatus;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.service.impl.LeaseAgendaServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseAgendaServiceImplTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private RentAdjustmentService rentAdjustmentService;

    @InjectMocks
    private LeaseAgendaServiceImpl service;

    private static final Long OWNER_ID = 7L;
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 20);

    private Lease lease(long id, LocalDate start, LocalDate end, AdjustmentIndex idx, Integer freq) {
        Lease l = new Lease();
        l.setId(id);
        l.setStartDate(start);
        l.setEndDate(end);
        l.setMonthlyRent(new BigDecimal("100000.00"));
        l.setAdjustmentIndex(idx);
        l.setAdjustmentFrequencyMonths(freq);
        l.setStatus(LeaseStatus.ACTIVE);
        PropertyUnit p = new PropertyUnit();
        p.setAddress("Calle " + id);
        l.setPropertyUnit(p);
        Tenant t = new Tenant();
        t.setFullName("Inquilino " + id);
        l.setTenants(Set.of(t));
        return l;
    }

    private void given(Lease... leases) {
        when(leaseRepository.findByStatusAndOwnerIdAndDeletedFalse(LeaseStatus.ACTIVE, OWNER_ID))
            .thenReturn(List.of(leases));
    }

    private List<AgendaEvent> events(AgendaResponse r, String type) {
        return r.events().stream().filter(e -> e.type().equals(type)).toList();
    }

    private void givenNoIndexData() {
        when(rentAdjustmentService.computeAdjustedRent(any(), any(), any()))
            .thenAnswer(inv -> new AdjustedRentResponse(inv.getArgument(0), new BigDecimal("100000.00"),
                new BigDecimal("100000.00"), BigDecimal.ONE, "ICL", null, false));
    }

    @Test
    void adjustmentEvery12Months() {
        givenNoIndexData();
        // start 2025-03-10, end 2028-03-09: adjustments 2026-03 (past), 2027-03-10, 2028-03-10 (after end)
        given(lease(1, LocalDate.of(2025, 3, 10), LocalDate.of(2028, 3, 9), AdjustmentIndex.ICL, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365 * 2);
        assertThat(events(r, "ADJUSTMENT")).extracting(AgendaEvent::date)
            .containsExactly(LocalDate.of(2027, 3, 10));
    }

    @Test
    void adjustmentEvery6Months() {
        givenNoIndexData();
        given(lease(1, LocalDate.of(2025, 3, 10), LocalDate.of(2028, 3, 9), AdjustmentIndex.ICL, 6));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(events(r, "ADJUSTMENT")).extracting(AgendaEvent::date)
            .containsExactly(LocalDate.of(2027, 3, 10), LocalDate.of(2027, 9, 10));
    }

    @Test
    void adjustmentEvery3Months() {
        givenNoIndexData();
        given(lease(1, LocalDate.of(2025, 3, 10), LocalDate.of(2028, 3, 9), AdjustmentIndex.ICL, 3));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 200);
        assertThat(events(r, "ADJUSTMENT")).extracting(AgendaEvent::date)
            .containsExactly(LocalDate.of(2026, 12, 10), LocalDate.of(2027, 3, 10));
    }

    @Test
    void adjustmentWhenStartOnDay15KeepsDay() {
        givenNoIndexData();
        given(lease(1, LocalDate.of(2025, 11, 15), LocalDate.of(2028, 11, 14), AdjustmentIndex.IPC, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(events(r, "ADJUSTMENT")).extracting(AgendaEvent::date)
            .containsExactly(LocalDate.of(2026, 11, 15));
    }

    @Test
    void adjustmentWhenStartOnDay31UsesEndOfMonthWithoutDrift() {
        givenNoIndexData();
        // 31 Aug + 6m = 28 Feb 2026 (not 31 Mar), then +12m = 31 Aug 2026 again (no drift)
        given(lease(1, LocalDate.of(2025, 8, 31), LocalDate.of(2028, 8, 30), AdjustmentIndex.ICL, 6));
        AgendaResponse r = service.compute(OWNER_ID, LocalDate.of(2026, 1, 1), 365);
        assertThat(events(r, "ADJUSTMENT")).extracting(AgendaEvent::date)
            .containsExactly(LocalDate.of(2026, 2, 28), LocalDate.of(2026, 8, 31));
    }

    @Test
    void adjustmentAfterEndIsOmitted() {
        given(lease(1, LocalDate.of(2025, 11, 15), LocalDate.of(2026, 11, 14), AdjustmentIndex.ICL, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(events(r, "ADJUSTMENT")).isEmpty();
        assertThat(events(r, "END")).hasSize(1);
        verify(rentAdjustmentService, never()).computeAdjustedRent(any(), any(), any());
    }

    @Test
    void noneAndDolarIndexHaveNoAdjustmentEvent() {
        given(
            lease(1, LocalDate.of(2025, 11, 15), LocalDate.of(2027, 6, 14), AdjustmentIndex.NONE, 12),
            lease(2, LocalDate.of(2025, 11, 15), LocalDate.of(2027, 6, 14), AdjustmentIndex.DOLAR_BLUE, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(events(r, "ADJUSTMENT")).isEmpty();
        assertThat(r.events()).extracting(AgendaEvent::type).containsOnly("END");
    }

    private String levelForEndIn(int days) {
        given(lease(1, TODAY.minusYears(1), TODAY.plusDays(days), AdjustmentIndex.NONE, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        List<AgendaEvent> ends = events(r, "END");
        return ends.get(0).alertLevel();
    }

    @Test
    void alertWindowBoundaries() {
        assertThat(levelForEndIn(30)).isEqualTo("D30");
        org.mockito.Mockito.reset(leaseRepository);
        assertThat(levelForEndIn(31)).isEqualTo("D60");
        org.mockito.Mockito.reset(leaseRepository);
        assertThat(levelForEndIn(60)).isEqualTo("D60");
        org.mockito.Mockito.reset(leaseRepository);
        assertThat(levelForEndIn(61)).isEqualTo("D90");
        org.mockito.Mockito.reset(leaseRepository);
        assertThat(levelForEndIn(90)).isEqualTo("D90");
        org.mockito.Mockito.reset(leaseRepository);
        assertThat(levelForEndIn(91)).isEqualTo("NONE");
    }

    @Test
    void activeLeaseWithPastEndIsExpiredAlert() {
        given(
            lease(1, TODAY.minusYears(1), TODAY.plusDays(10), AdjustmentIndex.NONE, 12),
            lease(2, TODAY.minusYears(2), TODAY.minusDays(5), AdjustmentIndex.NONE, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        AgendaEvent first = r.events().get(0);
        assertThat(first.leaseId()).isEqualTo(2L);
        assertThat(first.alertLevel()).isEqualTo("EXPIRED");
        assertThat(first.daysUntil()).isEqualTo(-5);
        assertThat(r.summary().expiredNotRenewed()).isEqualTo(1);
    }

    @Test
    void endDateTodayIsNotExpired() {
        given(lease(1, TODAY.minusYears(1), TODAY, AdjustmentIndex.NONE, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(r.events().get(0).alertLevel()).isEqualTo("D30");
        assertThat(r.events().get(0).daysUntil()).isZero();
        assertThat(r.summary().expiredNotRenewed()).isZero();
    }

    @Test
    void terminatedLeaseExcluded() {
        // the repository is asked only for ACTIVE leases; a TERMINATED one returned by a sloppy query is still dropped
        Lease terminated = lease(1, TODAY.minusYears(1), TODAY.plusDays(10), AdjustmentIndex.NONE, 12);
        terminated.setStatus(LeaseStatus.TERMINATED);
        given(terminated);
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(r.events()).isEmpty();
    }

    @Test
    void estimatedRentFromAdjustedRentService() {
        Lease withIndex = lease(1, LocalDate.of(2025, 11, 15), LocalDate.of(2028, 11, 14), AdjustmentIndex.ICL, 3);
        when(rentAdjustmentService.computeAdjustedRent(1L, OWNER_ID, TODAY))
            .thenReturn(new AdjustedRentResponse(1L, new BigDecimal("100000.00"), new BigDecimal("123456.78"),
                new BigDecimal("1.2346"), "ICL", LocalDate.of(2026, 9, 1), true));
        given(withIndex);
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        List<AgendaEvent> adj = events(r, "ADJUSTMENT");
        assertThat(adj).hasSizeGreaterThan(1);
        assertThat(adj).allSatisfy(e -> {
            assertThat(e.estimatedRent()).isEqualByComparingTo("123456.78");
            assertThat(e.baseRent()).isEqualByComparingTo("100000.00");
            assertThat(e.indexType()).isEqualTo("ICL");
            assertThat(e.indexDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        });
        // one call per lease, not per event
        verify(rentAdjustmentService).computeAdjustedRent(1L, OWNER_ID, TODAY);
        verifyNoMoreInteractions(rentAdjustmentService);
    }

    @Test
    void estimatedRentNullWhenNoIndexData() {
        givenNoIndexData();
        given(lease(1, LocalDate.of(2025, 11, 15), LocalDate.of(2028, 11, 14), AdjustmentIndex.ICL, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(events(r, "ADJUSTMENT")).allSatisfy(e -> assertThat(e.estimatedRent()).isNull());
    }

    @Test
    void summaryCountsMatchEvents() {
        givenNoIndexData();
        given(
            lease(1, TODAY.minusYears(1), TODAY.plusDays(45), AdjustmentIndex.NONE, 12),   // expiring
            lease(2, TODAY.minusYears(1), TODAY.plusDays(200), AdjustmentIndex.NONE, 12),  // outside 90
            lease(3, TODAY.minusYears(2), TODAY.minusDays(3), AdjustmentIndex.NONE, 12),   // expired
            lease(4, LocalDate.of(2025, 10, 28), LocalDate.of(2028, 10, 27), AdjustmentIndex.ICL, 12)); // adj 2026-10-28
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(r.summary().expiringWithin90()).isEqualTo(1);
        assertThat(r.summary().adjustmentsThisMonth()).isEqualTo(1);
        assertThat(r.summary().expiredNotRenewed()).isEqualTo(1);
        assertThat(r.asOf()).isEqualTo(TODAY);
        assertThat(r.horizonDays()).isEqualTo(365);
    }

    @Test
    void eventsAreSortedByDateWithExpiredFirst() {
        given(
            lease(1, TODAY.minusYears(1), TODAY.plusDays(45), AdjustmentIndex.NONE, 12),
            lease(2, TODAY.minusYears(2), TODAY.minusDays(3), AdjustmentIndex.NONE, 12),
            lease(3, TODAY.minusYears(1), TODAY.plusDays(20), AdjustmentIndex.NONE, 12));
        AgendaResponse r = service.compute(OWNER_ID, TODAY, 365);
        assertThat(r.events()).extracting(AgendaEvent::leaseId).containsExactly(2L, 3L, 1L);
    }

    @Test
    void invalidHorizonRejected() {
        assertThatThrownBy(() -> service.compute(OWNER_ID, TODAY, 0))
            .isInstanceOf(BusinessLogicException.class).hasMessageContaining("horizonte");
        assertThatThrownBy(() -> service.compute(OWNER_ID, TODAY, 731))
            .isInstanceOf(BusinessLogicException.class).hasMessageContaining("horizonte");
    }

    @Test
    void onlyCallerOwnerIsQueried() {
        given();
        service.compute(OWNER_ID, TODAY, 365);
        verify(leaseRepository).findByStatusAndOwnerIdAndDeletedFalse(LeaseStatus.ACTIVE, OWNER_ID);
        verifyNoMoreInteractions(leaseRepository);
    }
}
