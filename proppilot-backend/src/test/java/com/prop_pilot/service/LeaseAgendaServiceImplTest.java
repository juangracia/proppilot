package com.prop_pilot.service;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.dto.LeaseAgendaItem;
import com.prop_pilot.dto.LeaseAgendaResponse;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.Lease.LeaseStatus;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 22);
    private static long nextId = 1;

    private Lease lease(LocalDate start, LocalDate end, AdjustmentIndex idx, Integer freq) {
        Lease l = new Lease();
        l.setId(nextId++);
        l.setStartDate(start);
        l.setEndDate(end);
        l.setMonthlyRent(new BigDecimal("100000.00"));
        l.setAdjustmentIndex(idx);
        l.setAdjustmentFrequencyMonths(freq);
        l.setStatus(LeaseStatus.ACTIVE);
        return l;
    }

    private Lease endingIn(long days) {
        return lease(LocalDate.of(2026, 1, 1), TODAY.plusDays(days), AdjustmentIndex.NONE, 12);
    }

    private LeaseAgendaItem single(Lease l) {
        return single(TODAY, l);
    }

    private LeaseAgendaItem single(LocalDate today, Lease l) {
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID)).thenReturn(List.of(l));
        return service.getAgenda(OWNER_ID, today).items().get(0);
    }

    private void noEstimate() {
        when(rentAdjustmentService.computeAdjustedRent(any(Lease.class), any(LocalDate.class)))
            .thenReturn(new AdjustedRentResponse(1L, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, "ICL", null, false));
    }

    @Test
    void u1_ninetyDaysIsD90_ninetyOneIsNone() {
        assertThat(single(endingIn(90)).alertLevel()).isEqualTo("D90");
        assertThat(single(endingIn(90)).daysToEnd()).isEqualTo(90);
        assertThat(single(endingIn(91)).alertLevel()).isEqualTo("NONE");
    }

    @Test
    void u2_sixtyDaysIsD60_sixtyOneIsD90() {
        assertThat(single(endingIn(60)).alertLevel()).isEqualTo("D60");
        assertThat(single(endingIn(61)).alertLevel()).isEqualTo("D90");
    }

    @Test
    void u3_thirtyDaysIsD30_thirtyOneIsD60() {
        assertThat(single(endingIn(30)).alertLevel()).isEqualTo("D30");
        assertThat(single(endingIn(31)).alertLevel()).isEqualTo("D60");
    }

    @Test
    void u4_endsTodayIsD30_pastIsEnded() {
        LeaseAgendaItem today = single(endingIn(0));
        assertThat(today.daysToEnd()).isZero();
        assertThat(today.alertLevel()).isEqualTo("D30");
        LeaseAgendaItem past = single(endingIn(-3));
        assertThat(past.daysToEnd()).isEqualTo(-3);
        assertThat(past.alertLevel()).isEqualTo("ENDED");
    }

    @Test
    void u5_nextAdjustmentIsStartPlusOneFrequency() {
        noEstimate();
        Lease l = lease(LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 28), AdjustmentIndex.ICL, 12);
        assertThat(single(l).nextAdjustmentDate()).isEqualTo(LocalDate.of(2027, 3, 1));
    }

    @Test
    void u6_semiannualFrequency() {
        noEstimate();
        Lease l = lease(LocalDate.of(2025, 6, 1), LocalDate.of(2027, 12, 31), AdjustmentIndex.ICL, 6);
        assertThat(single(l).nextAdjustmentDate()).isEqualTo(LocalDate.of(2026, 12, 1));
    }

    @Test
    void u7_adjustmentDateEqualToTodayCountsAsNext() {
        noEstimate();
        Lease l = lease(LocalDate.of(2025, 10, 22), LocalDate.of(2028, 10, 21), AdjustmentIndex.ICL, 12);
        assertThat(single(l).nextAdjustmentDate()).isEqualTo(TODAY);
    }

    @Test
    void u8_monthEndStartDoesNotDrift() {
        noEstimate();
        Lease l = lease(LocalDate.of(2025, 1, 31), LocalDate.of(2028, 1, 30), AdjustmentIndex.ICL, 1);
        assertThat(single(LocalDate.of(2026, 2, 15), l).nextAdjustmentDate()).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void u9_candidateOnOrAfterEndMeansNoNextAdjustment() {
        Lease a = lease(LocalDate.of(2025, 4, 1), LocalDate.of(2026, 11, 11), AdjustmentIndex.ICL, 12);
        LeaseAgendaItem ia = single(a);
        assertThat(ia.nextAdjustmentDate()).isNull();
        assertThat(ia.estimatedAmount()).isNull();
        assertThat(ia.estimateAvailable()).isFalse();

        Lease b = lease(LocalDate.of(2025, 4, 1), LocalDate.of(2026, 4, 1), AdjustmentIndex.ICL, 12);
        assertThat(single(LocalDate.of(2026, 3, 1), b).nextAdjustmentDate()).isNull();
        verify(rentAdjustmentService, never()).computeAdjustedRent(any(Lease.class), any(LocalDate.class));
    }

    @Test
    void u10_nullFrequencyIsTwelve() {
        noEstimate();
        Lease l = lease(LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 28), AdjustmentIndex.ICL, null);
        assertThat(single(l).nextAdjustmentDate()).isEqualTo(LocalDate.of(2027, 3, 1));
    }

    @Test
    void u11_indexNoneHasNoAdjustments() {
        Lease l = lease(LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 28), AdjustmentIndex.NONE, 12);
        LeaseAgendaItem item = single(l);
        assertThat(item.nextAdjustmentDate()).isNull();
        assertThat(item.adjustmentDatesInWindow()).isEmpty();
        assertThat(item.estimateAvailable()).isFalse();
    }

    @Test
    void u12_estimateComesFromRentAdjustmentAsOfNextDate() {
        Lease l = lease(LocalDate.of(2025, 11, 1), LocalDate.of(2027, 10, 31), AdjustmentIndex.ICL, 12);
        when(rentAdjustmentService.computeAdjustedRent(eq(l), eq(LocalDate.of(2026, 11, 1))))
            .thenReturn(new AdjustedRentResponse(l.getId(), new BigDecimal("480000.00"), new BigDecimal("778992.00"),
                new BigDecimal("1.6229"), "ICL", LocalDate.of(2026, 10, 1), true));
        LeaseAgendaItem item = single(l);
        assertThat(item.nextAdjustmentDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(item.estimatedAmount()).isEqualByComparingTo("778992.00");
        assertThat(item.estimatedFactor()).isEqualByComparingTo("1.6229");
        assertThat(item.indexDate()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(item.estimateAvailable()).isTrue();
        verify(rentAdjustmentService).computeAdjustedRent(l, LocalDate.of(2026, 11, 1));
    }

    @Test
    void u13_noAdjustmentFromServiceMeansNoEstimateButDateStays() {
        noEstimate();
        Lease l = lease(LocalDate.of(2025, 11, 1), LocalDate.of(2027, 10, 31), AdjustmentIndex.ICL, 12);
        LeaseAgendaItem item = single(l);
        assertThat(item.nextAdjustmentDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(item.estimatedAmount()).isNull();
        assertThat(item.estimateAvailable()).isFalse();
    }

    @Test
    void u14_onlyActiveNonDeletedLeasesAreListedAndCounted() {
        Lease active = endingIn(10);
        Lease terminated = endingIn(10);
        terminated.setStatus(LeaseStatus.TERMINATED);
        Lease expired = endingIn(10);
        expired.setStatus(LeaseStatus.EXPIRED);
        Lease deleted = endingIn(10);
        deleted.setDeleted(true);
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID)).thenReturn(List.of(active, terminated, expired, deleted));
        LeaseAgendaResponse r = service.getAgenda(OWNER_ID, TODAY);
        assertThat(r.items()).extracting(LeaseAgendaItem::leaseId).containsExactly(active.getId());
        assertThat(r.counts().d30()).isEqualTo(1);
    }

    @Test
    void u15_countsPerLevel() {
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID))
            .thenReturn(List.of(endingIn(80), endingIn(60), endingIn(20), endingIn(-5), endingIn(400)));
        var counts = service.getAgenda(OWNER_ID, TODAY).counts();
        assertThat(counts.d90()).isEqualTo(1);
        assertThat(counts.d60()).isEqualTo(1);
        assertThat(counts.d30()).isEqualTo(1);
        assertThat(counts.ended()).isEqualTo(1);
    }

    @Test
    void u16_windowAndOrdering() {
        Lease late = endingIn(80);
        Lease early = endingIn(20);
        Lease sameEndHigherId = endingIn(20);
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID)).thenReturn(List.of(late, sameEndHigherId, early));
        LeaseAgendaResponse r = service.getAgenda(OWNER_ID, TODAY);
        assertThat(r.today()).isEqualTo(TODAY);
        assertThat(r.months()).containsExactly("2026-09", "2026-10", "2026-11", "2026-12", "2027-01");
        assertThat(r.items()).extracting(LeaseAgendaItem::leaseId)
            .containsExactly(early.getId(), sameEndHigherId.getId(), late.getId());
    }

    @Test
    void u17_everyAdjustmentInsideTheWindowIsListed() {
        noEstimate();
        Lease l = lease(LocalDate.of(2026, 6, 1), LocalDate.of(2028, 5, 31), AdjustmentIndex.IPC, 3);
        LeaseAgendaItem item = single(l);
        assertThat(item.adjustmentDatesInWindow()).containsExactly(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 1));
        assertThat(item.nextAdjustmentDate()).isEqualTo(LocalDate.of(2026, 12, 1));
    }

    @Test
    void u18_onlyTheGivenOwnerIsQueried() {
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID)).thenReturn(List.of());
        service.getAgenda(OWNER_ID, TODAY);
        verify(leaseRepository).findByOwnerIdAndDeletedFalse(OWNER_ID);
        verifyNoMoreInteractions(leaseRepository);
    }
}
