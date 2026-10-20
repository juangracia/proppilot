package com.prop_pilot.service;

import com.prop_pilot.dto.DelinquencyItem;
import com.prop_pilot.dto.DelinquencyResponse;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.LeaseStatus;
import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.Payment.PaymentStatus;
import com.prop_pilot.entity.Payment.PaymentType;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.service.impl.DelinquencyServiceImpl;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DelinquencyServiceImplTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks
    private DelinquencyServiceImpl service;

    private static final Long OWNER_ID = 7L;
    private static final Long OTHER_OWNER_ID = 8L;
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 20);
    private static final BigDecimal RENT = new BigDecimal("100000.00");

    private Tenant tenant(Long id, String name, String phone) {
        Tenant t = new Tenant();
        t.setId(id);
        t.setFullName(name);
        t.setPhone(phone);
        return t;
    }

    private Lease lease(Long id, LocalDate start, LocalDate end, Integer dueDay, LeaseStatus status, Tenant... tenants) {
        PropertyUnit unit = new PropertyUnit();
        unit.setAddress("Calle " + id);
        Lease l = new Lease();
        l.setId(id);
        l.setStartDate(start);
        l.setEndDate(end);
        l.setMonthlyRent(RENT);
        l.setPaymentDueDay(dueDay);
        l.setStatus(status);
        l.setPropertyUnit(unit);
        l.setTenants(Set.of(tenants));
        return l;
    }

    private Lease activeLease(Long id, LocalDate start, Integer dueDay) {
        return lease(id, start, LocalDate.of(2028, 8, 1), dueDay, LeaseStatus.ACTIVE,
                tenant(id * 10, "Inquilino " + id, "+54 9 11 5555-000" + id));
    }

    private Payment payment(String amount, PaymentType type, PaymentStatus status) {
        Payment p = new Payment();
        p.setAmount(new BigDecimal(amount));
        p.setPaymentType(type);
        p.setStatus(status);
        p.setPaymentDate(LocalDate.of(2026, 9, 1));
        return p;
    }

    private Payment rentPaid(String amount) {
        return payment(amount, PaymentType.RENT, PaymentStatus.PAID);
    }

    private void givenLeases(Lease... leases) {
        when(leaseRepository.findByOwnerIdAndDeletedFalse(OWNER_ID)).thenReturn(List.of(leases));
    }

    private void givenPaid(Lease lease, Payment... payments) {
        when(paymentRepository.findByLeaseIdAndStatusAndOwnerId(lease.getId(), PaymentStatus.PAID, OWNER_ID))
                .thenReturn(List.of(payments));
    }

    @Test
    void upToDateLeaseIsNotListed() {
        // due dates: Aug 10, Sep 10, Oct 10 -> 3 months, all paid
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        givenPaid(l, rentPaid("100000"), rentPaid("100000"), rentPaid("100000"));

        DelinquencyResponse r = service.compute(OWNER_ID, TODAY);

        assertThat(r.items()).isEmpty();
        assertThat(r.totalOwed()).isEqualByComparingTo("0");
        assertThat(r.tenantCount()).isZero();
        assertThat(r.basis()).isEqualTo("BASE_RENT");
    }

    @Test
    void onDueDayIsNotOverdue() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        givenPaid(l, rentPaid("100000"), rentPaid("100000"));

        // asOf == due day of October: October does not count yet
        assertThat(service.compute(OWNER_ID, LocalDate.of(2026, 10, 10)).items()).isEmpty();
        // the day after it does
        DelinquencyResponse next = service.compute(OWNER_ID, LocalDate.of(2026, 10, 11));
        assertThat(next.items()).hasSize(1);
        assertThat(next.items().get(0).daysLate()).isEqualTo(1);
    }

    @Test
    void oneUnpaidMonth() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        givenPaid(l, rentPaid("100000"), rentPaid("100000"));

        DelinquencyResponse r = service.compute(OWNER_ID, TODAY);

        assertThat(r.items()).hasSize(1);
        DelinquencyItem item = r.items().get(0);
        assertThat(item.leaseId()).isEqualTo(1L);
        assertThat(item.monthsOwed()).isEqualTo(1);
        assertThat(item.amountOwed()).isEqualByComparingTo("100000");
        assertThat(item.partialAmount()).isEqualByComparingTo("0");
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 10, 10));
        assertThat(item.daysLate()).isEqualTo(10);
        assertThat(item.baseRent()).isEqualByComparingTo("100000");
        assertThat(item.tenantName()).isEqualTo("Inquilino 1");
        assertThat(item.propertyAddress()).isEqualTo("Calle 1");
    }

    @Test
    void twoUnpaidMonthsOldestDrivesDaysLate() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        givenPaid(l, rentPaid("100000"));

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.monthsOwed()).isEqualTo(2);
        assertThat(item.amountOwed()).isEqualByComparingTo("200000");
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 9, 10));
        assertThat(item.daysLate()).isEqualTo(40);
    }

    @Test
    void partialPaymentAppliedFifo() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        // 3 months due (300000), 150000 paid: Aug fully covered, Sep half covered
        givenPaid(l, rentPaid("150000"));

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.amountOwed()).isEqualByComparingTo("150000");
        assertThat(item.monthsOwed()).isEqualTo(1);
        assertThat(item.partialAmount()).isEqualByComparingTo("50000");
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 9, 10));
        assertThat(item.daysLate()).isEqualTo(40);
    }

    @Test
    void terminatedLeaseExcluded() {
        Tenant t = tenant(1L, "A", "1");
        Lease terminated = lease(1L, LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 1), 10, LeaseStatus.TERMINATED, t);
        Lease expired = lease(2L, LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 1), 10, LeaseStatus.EXPIRED, t);
        givenLeases(terminated, expired);

        assertThat(service.compute(OWNER_ID, TODAY).items()).isEmpty();
        verify(leaseRepository).findByOwnerIdAndDeletedFalse(OWNER_ID);
        verifyNoMoreInteractions(leaseRepository, paymentRepository);
    }

    @Test
    void leaseStartingMidMonthFirstDueIsNextMonth() {
        // starts the 15th, due day 10: first due date is Oct 10, not Sep 10
        Lease l = activeLease(1L, LocalDate.of(2026, 9, 15), 10);
        givenLeases(l);
        givenPaid(l);

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.monthsOwed()).isEqualTo(1);
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 10, 10));
    }

    @Test
    void nullDueDayDefaultsToTen() {
        Lease l = activeLease(1L, LocalDate.of(2026, 9, 15), null);
        givenLeases(l);
        givenPaid(l);

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 10, 10));
    }

    @Test
    void customDueDayIsUsed() {
        Lease l = activeLease(1L, LocalDate.of(2026, 9, 1), 15);
        givenLeases(l);
        givenPaid(l);

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        // Sep 15 and Oct 15 are both before Oct 20
        assertThat(item.monthsOwed()).isEqualTo(2);
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 9, 15));
    }

    @Test
    void pendingPaymentsDoNotCount() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        // only the PAID rent counts; PENDING rent and a PAID deposit must be ignored
        givenPaid(l,
                rentPaid("100000"),
                payment("100000", PaymentType.RENT, PaymentStatus.PENDING),
                payment("100000", PaymentType.DEPOSIT, PaymentStatus.PAID));

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.monthsOwed()).isEqualTo(2);
        assertThat(item.amountOwed()).isEqualByComparingTo("200000");
        verify(paymentRepository).findByLeaseIdAndStatusAndOwnerId(1L, PaymentStatus.PAID, OWNER_ID);
    }

    @Test
    void activeLeasePastEndCappedAtEndDate() {
        // ended Mar 31 but still ACTIVE: months stop at Mar 10, nothing after endDate
        Lease l = lease(1L, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 10, LeaseStatus.ACTIVE,
                tenant(10L, "Vencido", "1"));
        givenLeases(l);
        givenPaid(l);

        DelinquencyItem item = service.compute(OWNER_ID, TODAY).items().get(0);

        assertThat(item.monthsOwed()).isEqualTo(3);
        assertThat(item.amountOwed()).isEqualByComparingTo("300000");
        assertThat(item.oldestUnpaidDueDate()).isEqualTo(LocalDate.of(2026, 1, 10));
    }

    @Test
    void multiTenantLeaseListedOnceWithFirstPhone() {
        Lease l = lease(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2028, 9, 1), 10, LeaseStatus.ACTIVE,
                tenant(20L, "Beto", "222"), tenant(10L, "Ana", "111"));
        givenLeases(l);
        givenPaid(l);

        DelinquencyResponse r = service.compute(OWNER_ID, TODAY);

        assertThat(r.items()).hasSize(1);
        assertThat(r.items().get(0).tenantName()).isEqualTo("Ana, Beto");
        assertThat(r.items().get(0).tenantPhone()).isEqualTo("111");
    }

    @Test
    void zeroRentLeaseIsSkipped() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        l.setMonthlyRent(BigDecimal.ZERO);
        givenLeases(l);

        assertThat(service.compute(OWNER_ID, TODAY).items()).isEmpty();
    }

    @Test
    void totalsAreSumOfItemsSortedByDaysLateDescending() {
        Lease recent = activeLease(1L, LocalDate.of(2026, 8, 1), 10);   // 1 month owed, 10 days late
        Lease old = activeLease(2L, LocalDate.of(2026, 8, 1), 10);      // 3 months owed, 71 days late
        givenLeases(recent, old);
        givenPaid(recent, rentPaid("200000"));
        givenPaid(old);

        DelinquencyResponse r = service.compute(OWNER_ID, TODAY);

        assertThat(r.items()).extracting(DelinquencyItem::leaseId).containsExactly(2L, 1L);
        assertThat(r.items().get(0).daysLate()).isEqualTo(71);
        assertThat(r.tenantCount()).isEqualTo(2);
        assertThat(r.totalOwed()).isEqualByComparingTo("400000");
        assertThat(r.asOf()).isEqualTo(TODAY);
    }

    @Test
    void onlyCallerOwnerIsQueried() {
        Lease l = activeLease(1L, LocalDate.of(2026, 8, 1), 10);
        givenLeases(l);
        givenPaid(l, rentPaid("100000"), rentPaid("100000"));

        DelinquencyResponse r = service.compute(OWNER_ID, TODAY);

        assertThat(r.items()).extracting(DelinquencyItem::leaseId).containsExactly(1L);
        verify(leaseRepository).findByOwnerIdAndDeletedFalse(OWNER_ID);
        verify(leaseRepository, never()).findByOwnerIdAndDeletedFalse(OTHER_OWNER_ID);
        verify(paymentRepository).findByLeaseIdAndStatusAndOwnerId(1L, PaymentStatus.PAID, OWNER_ID);
        verifyNoMoreInteractions(leaseRepository, paymentRepository);
    }
}
