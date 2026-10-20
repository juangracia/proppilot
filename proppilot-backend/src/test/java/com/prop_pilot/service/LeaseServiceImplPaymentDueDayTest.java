package com.prop_pilot.service;

import com.prop_pilot.entity.Lease;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.repository.TenantRepository;
import com.prop_pilot.repository.UserRepository;
import com.prop_pilot.service.impl.LeaseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseServiceImplPaymentDueDayTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private PropertyUnitRepository propertyUnitRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private UserRepository userRepository;
    @Mock private CountryConfigService countryConfigService;

    private LeaseServiceImpl service;

    private static final Long OWNER_ID = 7L;
    private static final Long LEASE_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new LeaseServiceImpl(leaseRepository, propertyUnitRepository, tenantRepository,
                userRepository, countryConfigService);
    }

    private Lease existing(Integer dueDay) {
        Lease l = new Lease();
        l.setId(LEASE_ID);
        l.setPaymentDueDay(dueDay);
        when(leaseRepository.findByIdAndOwnerIdAndDeletedFalse(LEASE_ID, OWNER_ID)).thenReturn(Optional.of(l));
        return l;
    }

    /** Partial update body: the entity defaults countryCode to AR, which update would try to validate. */
    private Lease changes() {
        Lease changes = new Lease();
        changes.setCountryCode(null);
        return changes;
    }

    @Test
    void updateKeepsPaymentDueDay() {
        Lease stored = existing(10);
        when(leaseRepository.save(any(Lease.class))).thenAnswer(inv -> inv.getArgument(0));
        Lease changes = changes();
        changes.setPaymentDueDay(15);

        Lease saved = service.updateLease(LEASE_ID, changes, OWNER_ID);

        assertThat(saved.getPaymentDueDay()).isEqualTo(15);
        assertThat(stored.getPaymentDueDay()).isEqualTo(15);
    }

    @Test
    void updateWithoutPaymentDueDayLeavesItUnchanged() {
        existing(15);
        when(leaseRepository.save(any(Lease.class))).thenAnswer(inv -> inv.getArgument(0));

        Lease saved = service.updateLease(LEASE_ID, changes(), OWNER_ID);

        assertThat(saved.getPaymentDueDay()).isEqualTo(15);
    }

    @Test
    void updateRejectsPaymentDueDayOutOfRange() {
        existing(10);
        for (int invalid : new int[]{0, 29}) {
            Lease changes = changes();
            changes.setPaymentDueDay(invalid);

            assertThatThrownBy(() -> service.updateLease(LEASE_ID, changes, OWNER_ID))
                    .isInstanceOf(BusinessLogicException.class)
                    .hasMessage("El día de vencimiento debe estar entre 1 y 28");
        }
        verify(leaseRepository, never()).save(any(Lease.class));
    }
}
