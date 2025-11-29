package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.entity.User;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.repository.TenantRepository;
import com.prop_pilot.repository.UserRepository;
import com.prop_pilot.service.LeaseService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeaseServiceImpl implements LeaseService {

    private final LeaseRepository leaseRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public LeaseServiceImpl(LeaseRepository leaseRepository,
                           PropertyUnitRepository propertyUnitRepository,
                           TenantRepository tenantRepository,
                           UserRepository userRepository) {
        this.leaseRepository = leaseRepository;
        this.propertyUnitRepository = propertyUnitRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Lease createLease(@NonNull Lease lease, @NonNull Long ownerId) {
        // Get property unit ID from transient field or nested object
        Long propUnitId = lease.getInputPropertyUnitId();
        if (propUnitId == null && lease.getPropertyUnit() != null) {
            propUnitId = lease.getPropertyUnit().getId();
        }

        // Get tenant ID from transient field or nested object
        Long tenId = lease.getInputTenantId();
        if (tenId == null && lease.getTenant() != null) {
            tenId = lease.getTenant().getId();
        }

        // Validate required fields
        if (propUnitId == null) {
            throw new BusinessLogicException("Property unit is required for lease");
        }
        if (tenId == null) {
            throw new BusinessLogicException("Tenant is required for lease");
        }

        // Final variables for lambdas
        final Long propertyUnitId = propUnitId;
        final Long tenantId = tenId;

        // Validate property unit exists and belongs to owner
        PropertyUnit propertyUnit = propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        // Validate tenant exists and belongs to owner
        Tenant tenant = tenantRepository.findByIdAndOwnerId(tenantId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tenantId));

        // Validate dates
        if (lease.getStartDate() == null || lease.getEndDate() == null) {
            throw new BusinessLogicException("Start date and end date are required");
        }
        if (lease.getEndDate().isBefore(lease.getStartDate())) {
            throw new BusinessLogicException("End date must be after start date");
        }

        // Check for overlapping leases on the same property
        if (hasOverlappingLease(propertyUnitId, lease.getStartDate(), lease.getEndDate(), null)) {
            throw new BusinessLogicException("There is already an active lease for this property during the specified period");
        }

        // Set the relationships
        lease.setPropertyUnit(propertyUnit);
        lease.setTenant(tenant);

        // Set owner
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        lease.setOwner(owner);

        // Default status if not set
        if (lease.getStatus() == null) {
            lease.setStatus(Lease.LeaseStatus.ACTIVE);
        }

        return leaseRepository.save(lease);
    }

    @Override
    public Lease getLeaseById(@NonNull Long id, @NonNull Long ownerId) {
        return leaseRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + id));
    }

    @Override
    public List<Lease> getAllLeases(@NonNull Long ownerId) {
        return leaseRepository.findByOwnerId(ownerId);
    }

    @Override
    public List<Lease> getLeasesByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId) {
        // Verify property belongs to owner
        propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        return leaseRepository.findByPropertyUnitIdAndOwnerId(propertyUnitId, ownerId);
    }

    @Override
    public List<Lease> getLeasesByTenant(@NonNull Long tenantId, @NonNull Long ownerId) {
        // Verify tenant belongs to owner
        tenantRepository.findByIdAndOwnerId(tenantId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tenantId));

        return leaseRepository.findByTenantIdAndOwnerId(tenantId, ownerId);
    }

    @Override
    public List<Lease> getActiveLeases(@NonNull Long ownerId) {
        return leaseRepository.findActiveLeasesByOwnerIdAndDate(ownerId, LocalDate.now());
    }

    @Override
    public Lease getActiveLeaseByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId) {
        return leaseRepository.findActiveLeaseByPropertyUnitIdAndOwnerId(propertyUnitId, ownerId, LocalDate.now())
                .orElse(null);
    }

    @Override
    public Lease getActiveLeaseByTenant(@NonNull Long tenantId, @NonNull Long ownerId) {
        return leaseRepository.findActiveLeaseByTenantIdAndOwnerId(tenantId, ownerId, LocalDate.now())
                .orElse(null);
    }

    @Override
    @Transactional
    public Lease updateLease(@NonNull Long id, @NonNull Lease lease, @NonNull Long ownerId) {
        Lease existingLease = getLeaseById(id, ownerId);

        // Check for overlapping leases if dates changed
        if ((lease.getStartDate() != null && !lease.getStartDate().equals(existingLease.getStartDate())) ||
            (lease.getEndDate() != null && !lease.getEndDate().equals(existingLease.getEndDate()))) {

            LocalDate newStartDate = lease.getStartDate() != null ? lease.getStartDate() : existingLease.getStartDate();
            LocalDate newEndDate = lease.getEndDate() != null ? lease.getEndDate() : existingLease.getEndDate();

            if (newEndDate.isBefore(newStartDate)) {
                throw new BusinessLogicException("End date must be after start date");
            }

            if (hasOverlappingLease(existingLease.getPropertyUnit().getId(), newStartDate, newEndDate, id)) {
                throw new BusinessLogicException("There is already an active lease for this property during the specified period");
            }

            existingLease.setStartDate(newStartDate);
            existingLease.setEndDate(newEndDate);
        }

        if (lease.getMonthlyRent() != null) {
            existingLease.setMonthlyRent(lease.getMonthlyRent());
        }

        if (lease.getStatus() != null) {
            existingLease.setStatus(lease.getStatus());
        }

        return leaseRepository.save(existingLease);
    }

    @Override
    @Transactional
    public void terminateLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = getLeaseById(id, ownerId);
        lease.setStatus(Lease.LeaseStatus.TERMINATED);
        leaseRepository.save(lease);
    }

    @Override
    @Transactional
    public void deleteLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = getLeaseById(id, ownerId);

        // Don't allow deletion if there are payments
        if (lease.getPayments() != null && !lease.getPayments().isEmpty()) {
            throw new BusinessLogicException("Cannot delete lease with existing payments. Terminate the lease instead.");
        }

        leaseRepository.delete(lease);
    }

    @Override
    public boolean hasOverlappingLease(@NonNull Long propertyUnitId, @NonNull LocalDate startDate,
                                       @NonNull LocalDate endDate, Long excludeLeaseId) {
        if (excludeLeaseId != null) {
            return leaseRepository.existsOverlappingLeaseExcluding(propertyUnitId, startDate, endDate, excludeLeaseId);
        }
        return leaseRepository.existsOverlappingLease(propertyUnitId, startDate, endDate);
    }
}
