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
import com.prop_pilot.service.CountryConfigService;
import com.prop_pilot.service.LeaseService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LeaseServiceImpl implements LeaseService {

    private final LeaseRepository leaseRepository;
    private final PropertyUnitRepository propertyUnitRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final CountryConfigService countryConfigService;

    public LeaseServiceImpl(LeaseRepository leaseRepository,
                           PropertyUnitRepository propertyUnitRepository,
                           TenantRepository tenantRepository,
                           UserRepository userRepository,
                           CountryConfigService countryConfigService) {
        this.leaseRepository = leaseRepository;
        this.propertyUnitRepository = propertyUnitRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.countryConfigService = countryConfigService;
    }

    @Override
    @Transactional
    public Lease createLease(@NonNull Lease lease, @NonNull Long ownerId) {
        // Get property unit ID from transient field or nested object
        Long propUnitId = lease.getInputPropertyUnitId();
        if (propUnitId == null && lease.getPropertyUnit() != null) {
            propUnitId = lease.getPropertyUnit().getId();
        }

        // Get tenant IDs from transient field
        List<Long> tenantIds = lease.getInputTenantIds();
        if (tenantIds == null || tenantIds.isEmpty()) {
            throw new BusinessLogicException("At least one tenant is required for lease");
        }

        // Validate required fields
        if (propUnitId == null) {
            throw new BusinessLogicException("Property unit is required for lease");
        }

        // Final variable for lambda
        final Long propertyUnitId = propUnitId;

        // Validate property unit exists and belongs to owner
        PropertyUnit propertyUnit = propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        // Validate all tenants exist and belong to owner
        Set<Tenant> tenants = new HashSet<>();
        for (Long tenantId : tenantIds) {
            Tenant tenant = tenantRepository.findByIdAndOwnerId(tenantId, ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tenantId));
            tenants.add(tenant);
        }

        // Validate dates
        if (lease.getStartDate() == null || lease.getEndDate() == null) {
            throw new BusinessLogicException("Start date and end date are required");
        }
        if (!lease.getEndDate().isAfter(lease.getStartDate())) {
            throw new BusinessLogicException("End date must be after start date");
        }
        // Minimum lease duration: 30 days
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(lease.getStartDate(), lease.getEndDate());
        if (daysBetween < 30) {
            throw new BusinessLogicException("Lease must be at least 30 days long");
        }

        // Check for overlapping leases on the same property
        if (hasOverlappingLease(propertyUnitId, lease.getStartDate(), lease.getEndDate(), null)) {
            throw new BusinessLogicException("There is already an active lease for this property during the specified period");
        }

        // Validate country code and adjustment index
        String countryCode = lease.getCountryCode();
        if (countryCode == null || countryCode.isEmpty()) {
            countryCode = "AR";  // Default to Argentina
        }
        countryCode = countryCode.toUpperCase();

        if (!countryConfigService.isCountrySupported(countryCode)) {
            throw new BusinessLogicException("Unsupported country code: " + countryCode);
        }

        // Validate that the adjustment index is valid for the country
        if (lease.getAdjustmentIndex() != null &&
            !countryConfigService.isValidIndexForCountry(lease.getAdjustmentIndex(), countryCode)) {
            throw new BusinessLogicException("Adjustment index " + lease.getAdjustmentIndex() +
                " is not available for country " + countryCode);
        }

        lease.setCountryCode(countryCode);

        // Set the relationships
        lease.setPropertyUnit(propertyUnit);
        lease.setTenants(tenants);

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
        return leaseRepository.findByIdAndOwnerIdAndDeletedFalse(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + id));
    }

    @Override
    public List<Lease> getAllLeases(@NonNull Long ownerId) {
        return leaseRepository.findByOwnerIdAndDeletedFalse(ownerId);
    }

    @Override
    public List<Lease> getLeasesByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId) {
        // Verify property belongs to owner
        propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        return leaseRepository.findByPropertyUnitIdAndOwnerIdAndDeletedFalse(propertyUnitId, ownerId);
    }

    @Override
    public List<Lease> getLeasesByTenant(@NonNull Long tenantId, @NonNull Long ownerId) {
        // Verify tenant belongs to owner
        tenantRepository.findByIdAndOwnerId(tenantId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + tenantId));

        return leaseRepository.findByTenantIdAndOwnerIdAndDeletedFalse(tenantId, ownerId);
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
    public List<Lease> getActiveLeasesByTenant(@NonNull Long tenantId, @NonNull Long ownerId) {
        return leaseRepository.findActiveLeasesByTenantIdAndOwnerId(tenantId, ownerId, LocalDate.now());
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

            if (!newEndDate.isAfter(newStartDate)) {
                throw new BusinessLogicException("End date must be after start date");
            }
            // Minimum lease duration: 30 days
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(newStartDate, newEndDate);
            if (daysBetween < 30) {
                throw new BusinessLogicException("Lease must be at least 30 days long");
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

        // Validate country and adjustment index if being updated
        if (lease.getCountryCode() != null) {
            String countryCode = lease.getCountryCode().toUpperCase();
            if (!countryConfigService.isCountrySupported(countryCode)) {
                throw new BusinessLogicException("Unsupported country code: " + countryCode);
            }
            existingLease.setCountryCode(countryCode);
        }

        if (lease.getAdjustmentIndex() != null) {
            String countryCode = existingLease.getCountryCode() != null ?
                existingLease.getCountryCode() : "AR";
            if (!countryConfigService.isValidIndexForCountry(lease.getAdjustmentIndex(), countryCode)) {
                throw new BusinessLogicException("Adjustment index " + lease.getAdjustmentIndex() +
                    " is not available for country " + countryCode);
            }
            existingLease.setAdjustmentIndex(lease.getAdjustmentIndex());
        }

        if (lease.getAdjustmentFrequencyMonths() != null) {
            existingLease.setAdjustmentFrequencyMonths(lease.getAdjustmentFrequencyMonths());
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
    public void reactivateLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = getLeaseById(id, ownerId);

        if (lease.getStatus() != Lease.LeaseStatus.TERMINATED) {
            throw new BusinessLogicException("Only terminated leases can be reactivated");
        }

        // Check for overlapping active leases before reactivating
        if (hasOverlappingLease(lease.getPropertyUnit().getId(), lease.getStartDate(), lease.getEndDate(), id)) {
            throw new BusinessLogicException("Cannot reactivate lease: there is already an active lease for this property during the specified period");
        }

        // Check if lease dates are still valid (end date not in the past)
        if (lease.getEndDate().isBefore(LocalDate.now())) {
            lease.setStatus(Lease.LeaseStatus.EXPIRED);
        } else {
            lease.setStatus(Lease.LeaseStatus.ACTIVE);
        }
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
    @Transactional
    public void softDeleteLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = getLeaseById(id, ownerId);
        lease.setDeleted(true);
        lease.setDeletedAt(LocalDateTime.now());
        leaseRepository.save(lease);
    }

    @Override
    @Transactional
    public void restoreLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = leaseRepository.findByIdAndOwnerIdAndDeletedTrue(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Deleted lease not found with id: " + id));

        // Check for overlapping leases before restoring
        if (lease.getStatus() == Lease.LeaseStatus.ACTIVE &&
            hasOverlappingLease(lease.getPropertyUnit().getId(), lease.getStartDate(), lease.getEndDate(), id)) {
            throw new BusinessLogicException("Cannot restore lease: there is already an active lease for this property during the specified period");
        }

        lease.setDeleted(false);
        lease.setDeletedAt(null);
        leaseRepository.save(lease);
    }

    @Override
    public List<Lease> getDeletedLeases(@NonNull Long ownerId) {
        return leaseRepository.findByOwnerIdAndDeletedTrue(ownerId);
    }

    @Override
    @Transactional
    public void permanentlyDeleteLease(@NonNull Long id, @NonNull Long ownerId) {
        Lease lease = leaseRepository.findByIdAndOwnerIdAndDeletedTrue(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Deleted lease not found with id: " + id));

        // Only allow permanent deletion of already soft-deleted leases
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
