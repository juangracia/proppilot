package com.prop_pilot.service;

import com.prop_pilot.dto.DelinquencyReport;
import com.prop_pilot.dto.DelinquentLease;
import com.prop_pilot.entity.Lease;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DelinquencyServiceImplTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks
    private DelinquencyServiceImpl service;

    private static final Long OWNER_ID = 7L;
    private static final LocalDate AS_OF = LocalDate.of(2026, 10, 22);
    private static final BigDecimal RENT = new BigDecimal("420000.00");

    private Lease lease(long id, LocalDate start, LocalDate end, BigDecimal rent) {
        Lease l = new Lease();
        l.setId(id);
        l.setStartDate(start);
        l.setEndDate(end);
        l.setMonthlyRent(rent);
        l.setStatus(Lease.LeaseStatus.ACTIVE);
        PropertyUnit pu = new PropertyUnit();
        pu.setId(100 + id);
        pu.setAddress("Address " + id);
        l.setPropertyUnit(pu);
        Tenant t = new Tenant();
        t.setFullName("Tenant " + id);
        l.setTenants(Set.of(t));
        return l;
    }

    private void givenLeases(Lease... leases) {
        when(leaseRepository.findByStatusAndOwnerIdAndDeletedFalse(Lease.LeaseStatus.ACTIVE, OWNER_ID))
            .thenReturn(List.of(leases));
    }

    private void givenPaid(Object... idAndAmount) {
        List<Object[]> rows = new ArrayList<>();
        for (int i = 0; i < idAndAmount.length; i += 2) {
            rows.add(new Object[]{idAndAmount[i], idAndAmount[i + 1]});
        }
        when(paymentRepository.sumPaidRentByLeaseForOwner(OWNER_ID, AS_OF)).thenReturn(rows);
    }

    private BigDecimal rents(double n) {
        return RENT.multiply(BigDecimal.valueOf(n));
    }

    @Test
    void b1_twoMonthsUnpaid_isListedWithOwedAndDays() {
        givenLeases(lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT));
        givenPaid(2L, rents(12));

        DelinquencyReport r = service.getReport(OWNER_ID, AS_OF);

        assertThat(r.items()).hasSize(1);
        DelinquentLease d = r.items().get(0);
        assertThat(d.amountOwed()).isEqualByComparingTo("840000");
        assertThat(d.unpaidInstallments()).isEqualTo(2);
        assertThat(d.oldestDueDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(d.daysOverdue()).isEqualTo(51);
        assertThat(d.tenantNames()).containsExactly("Tenant 2");
        assertThat(d.propertyAddress()).isEqualTo("Address 2");
        assertThat(d.propertyUnitId()).isEqualTo(102L);
        assertThat(r.totalOwed()).isEqualByComparingTo("840000");
        assertThat(r.asOf()).isEqualTo(AS_OF);
    }

    @Test
    void b2_allPaid_isNotListed() {
        givenLeases(lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT));
        givenPaid(2L, rents(14));

        DelinquencyReport r = service.getReport(OWNER_ID, AS_OF);

        assertThat(r.items()).isEmpty();
        assertThat(r.totalOwed()).isEqualByComparingTo("0");
        assertThat(r.delinquentCount()).isZero();
    }

    @Test
    void b3_sevenOfEightPaid_oneUnpaidTwentyOneDays() {
        BigDecimal rent = new BigDecimal("650000.00");
        givenLeases(lease(4, LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 29), rent));
        givenPaid(4L, rent.multiply(BigDecimal.valueOf(7)));

        DelinquentLease d = service.getReport(OWNER_ID, AS_OF).items().get(0);

        assertThat(d.amountOwed()).isEqualByComparingTo("650000");
        assertThat(d.unpaidInstallments()).isEqualTo(1);
        assertThat(d.daysOverdue()).isEqualTo(21);
    }

    @Test
    void b4_oldestUnpaidDueToday_isNotListed() {
        givenLeases(lease(4, LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 29), RENT));
        when(paymentRepository.sumPaidRentByLeaseForOwner(OWNER_ID, LocalDate.of(2026, 10, 1)))
            .thenReturn(List.<Object[]>of(new Object[]{4L, rents(7)}));

        DelinquencyReport r = service.getReport(OWNER_ID, LocalDate.of(2026, 10, 1));

        assertThat(r.items()).isEmpty();
    }

    @Test
    void b5_midMonthStartWithoutPayments_isListed() {
        givenLeases(lease(5, LocalDate.of(2026, 10, 15), LocalDate.of(2028, 10, 14), RENT));
        givenPaid();

        DelinquentLease d = service.getReport(OWNER_ID, AS_OF).items().get(0);

        assertThat(d.daysOverdue()).isEqualTo(7);
        assertThat(d.amountOwed()).isEqualByComparingTo(RENT);
        assertThat(d.unpaidInstallments()).isEqualTo(1);
    }

    @Test
    void b5b_threeInstallmentsDueOnTheStartDay() {
        givenLeases(lease(5, LocalDate.of(2026, 8, 22), LocalDate.of(2028, 8, 21), RENT));
        givenPaid();

        DelinquentLease d = service.getReport(OWNER_ID, AS_OF).items().get(0);

        assertThat(d.amountOwed()).isEqualByComparingTo(rents(3));
        assertThat(d.daysOverdue()).isEqualTo(61);
        assertThat(d.unpaidInstallments()).isEqualTo(3);
    }

    @Test
    void b6_partialPayment_countsAsUnpaidFromTheInstallmentNotCovered() {
        givenLeases(lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT));
        givenPaid(2L, rents(12.5));

        DelinquentLease d = service.getReport(OWNER_ID, AS_OF).items().get(0);

        assertThat(d.amountOwed()).isEqualByComparingTo(rents(1.5));
        assertThat(d.unpaidInstallments()).isEqualTo(2);
        assertThat(d.oldestDueDate()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    void b7_overpaid_isNotListed() {
        givenLeases(lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT));
        givenPaid(2L, rents(15));

        assertThat(service.getReport(OWNER_ID, AS_OF).items()).isEmpty();
    }

    @Test
    void b8_leaseEnded_dueCountStopsAtEndDate() {
        givenLeases(lease(8, LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31), RENT));
        givenPaid(8L, rents(10));

        DelinquentLease d = service.getReport(OWNER_ID, AS_OF).items().get(0);

        // 12 installments (2025-06 .. 2026-05), 10 paid
        assertThat(d.amountOwed()).isEqualByComparingTo(rents(2));
        assertThat(d.unpaidInstallments()).isEqualTo(2);
        assertThat(d.oldestDueDate()).isEqualTo(LocalDate.of(2026, 4, 1));
    }

    @Test
    void b9_startOnThe31st_dueDatesDoNotDrift() {
        // start 2026-01-31: due dates 01-31, 02-28, 03-31, 04-30
        givenLeases(lease(9, LocalDate.of(2026, 1, 31), LocalDate.of(2028, 1, 30), RENT));
        when(paymentRepository.sumPaidRentByLeaseForOwner(OWNER_ID, LocalDate.of(2026, 4, 30)))
            .thenReturn(List.<Object[]>of(new Object[]{9L, rents(1)}));

        DelinquentLease d = service.getReport(OWNER_ID, LocalDate.of(2026, 4, 30)).items().get(0);

        assertThat(d.oldestDueDate()).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(d.unpaidInstallments()).isEqualTo(3);
        assertThat(d.daysOverdue()).isEqualTo(61);
    }

    @Test
    void b10_leaseStartsAfterAsOf_isNotListed() {
        givenLeases(lease(10, LocalDate.of(2026, 11, 1), LocalDate.of(2028, 10, 31), RENT));
        givenPaid();

        assertThat(service.getReport(OWNER_ID, AS_OF).items()).isEmpty();
    }

    @Test
    void b11_onlyActiveLeasesOfTheOwnerAreQueried() {
        givenLeases();
        givenPaid();

        service.getReport(OWNER_ID, AS_OF);

        verify(leaseRepository).findByStatusAndOwnerIdAndDeletedFalse(Lease.LeaseStatus.ACTIVE, OWNER_ID);
    }

    @Test
    void b12_twoLeases_sortedByDaysDescWithTotalAndCount() {
        BigDecimal rent4 = new BigDecimal("650000.00");
        givenLeases(
            lease(4, LocalDate.of(2026, 3, 1), LocalDate.of(2028, 2, 29), rent4),
            lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT));
        givenPaid(4L, rent4.multiply(BigDecimal.valueOf(7)), 2L, rents(12));

        DelinquencyReport r = service.getReport(OWNER_ID, AS_OF);

        assertThat(r.items()).extracting(DelinquentLease::leaseId).containsExactly(2L, 4L);
        assertThat(r.totalOwed()).isEqualByComparingTo("1490000");
        assertThat(r.delinquentCount()).isEqualTo(2);
    }

    @Test
    void b13_structuredAddress_isShownAsStreetAndNumber() {
        Lease l = lease(2, LocalDate.of(2025, 9, 1), LocalDate.of(2027, 8, 31), RENT);
        l.getPropertyUnit().setAddress("Obispo Trejo 245, Piso 2, Depto A, Córdoba, Córdoba (X5000)");
        l.getPropertyUnit().setStreet("Obispo Trejo");
        l.getPropertyUnit().setStreetNumber("245");
        l.getPropertyUnit().setFloor("2");
        l.getPropertyUnit().setApartment("A");
        givenLeases(l);
        givenPaid();

        assertThat(service.getReport(OWNER_ID, AS_OF).items().get(0).propertyAddress())
            .isEqualTo("Obispo Trejo 245, Piso 2, Depto A");
    }
}
