package com.prop_pilot.controller;

import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.entity.User;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.repository.TenantRepository;
import com.prop_pilot.repository.UserRepository;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.DelinquencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against the real Postgres (lane DB). Each test rolls back. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
class DelinquencyControllerTest {

    private static final LocalDate AS_OF = LocalDate.of(2026, 10, 22);

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private PropertyUnitRepository propertyUnitRepository;
    @Autowired private LeaseRepository leaseRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private DelinquencyService delinquencyService;

    @MockBean private CurrentUserService currentUserService;

    private User ownerA;
    private User ownerB;

    @BeforeEach
    void setUp() {
        ownerA = newUser();
        ownerB = newUser();
        when(currentUserService.getCurrentUserId()).thenReturn(ownerA.getId());
    }

    private User newUser() {
        String id = UUID.randomUUID().toString();
        User u = new User();
        u.setEmail(id + "@test.local");
        u.setFullName("Owner " + id);
        u.setProvider("local");
        u.setProviderId(id);
        u.setCreatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    private Lease newLease(User owner, String address, LocalDate start) {
        String id = UUID.randomUUID().toString();
        Tenant t = new Tenant();
        t.setFullName("Tenant " + id);
        t.setNationalId(id);
        t.setEmail(id + "@t.local");
        t.setPhone("1");
        t.setOwner(owner);
        t = tenantRepository.save(t);

        PropertyUnit pu = new PropertyUnit();
        pu.setAddress(address);
        pu.setType("APARTMENT");
        pu.setBaseRentAmount(new BigDecimal("100.00"));
        pu.setOwner(owner);
        pu = propertyUnitRepository.save(pu);

        Lease l = new Lease();
        l.setOwner(owner);
        l.setPropertyUnit(pu);
        l.setTenants(Set.of(t));
        l.setStartDate(start);
        l.setEndDate(start.plusYears(2));
        l.setMonthlyRent(new BigDecimal("100.00"));
        l.setStatus(Lease.LeaseStatus.ACTIVE);
        return leaseRepository.save(l);
    }

    private void pay(Lease lease, String amount, Payment.PaymentType type, Payment.PaymentStatus status, LocalDate date) {
        Payment p = new Payment();
        p.setLease(lease);
        p.setOwner(lease.getOwner());
        p.setAmount(new BigDecimal(amount));
        p.setPaymentType(type);
        p.setStatus(status);
        p.setPaymentDate(date);
        paymentRepository.save(p);
    }

    @Test
    void b13_groupedQuery_sumsOnlyPaidRentUpToAsOf() {
        Lease lease = newLease(ownerA, "A street", LocalDate.of(2026, 1, 1));
        pay(lease, "100.00", Payment.PaymentType.RENT, Payment.PaymentStatus.PAID, LocalDate.of(2026, 1, 5));
        pay(lease, "50.00", Payment.PaymentType.RENT, Payment.PaymentStatus.PENDING, LocalDate.of(2026, 2, 5));
        pay(lease, "70.00", Payment.PaymentType.DEPOSIT, Payment.PaymentStatus.PAID, LocalDate.of(2026, 1, 5));
        pay(lease, "30.00", Payment.PaymentType.RENT, Payment.PaymentStatus.PAID, LocalDate.of(2026, 2, 20));

        var rows = paymentRepository.sumPaidRentByLeaseForOwner(ownerA.getId(), LocalDate.of(2026, 2, 10));

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(lease.getId());
        assertThat((BigDecimal) rows.get(0)[1]).isEqualByComparingTo("100");
    }

    @Test
    void b14_ownerScoping_onlyTheCallersLeasesAreReported() {
        Lease a = newLease(ownerA, "A street", LocalDate.of(2026, 1, 1));
        Lease b = newLease(ownerB, "B street", LocalDate.of(2026, 1, 1));

        var report = delinquencyService.getReport(ownerA.getId(), AS_OF);

        assertThat(report.items()).extracting("leaseId").containsExactly(a.getId());
        assertThat(report.items()).extracting("leaseId").doesNotContain(b.getId());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void b15_endpoint_returnsReportJson() throws Exception {
        newLease(ownerA, "A street", LocalDate.of(2026, 9, 1));

        mockMvc.perform(get("/api/delinquency").param("asOf", "2026-10-22"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.asOf").value("2026-10-22"))
            .andExpect(jsonPath("$.delinquentCount").value(1))
            .andExpect(jsonPath("$.totalOwed").value(200.0))
            .andExpect(jsonPath("$.items[0].daysOverdue").value(51))
            .andExpect(jsonPath("$.items[0].tenantNames").isArray())
            .andExpect(jsonPath("$.items[0].propertyAddress").value("A street"));
    }
}
