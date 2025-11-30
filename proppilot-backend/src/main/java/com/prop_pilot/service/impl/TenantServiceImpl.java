package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Tenant;
import com.prop_pilot.entity.User;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.TenantRepository;
import com.prop_pilot.repository.UserRepository;
import com.prop_pilot.service.TenantService;
import com.prop_pilot.exception.ResourceNotFoundException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final LeaseRepository leaseRepository;

    public TenantServiceImpl(TenantRepository tenantRepository, UserRepository userRepository, LeaseRepository leaseRepository) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.leaseRepository = leaseRepository;
    }

    @Override
    public Tenant createTenant(Tenant tenant, @NonNull Long ownerId) {
        // Validate that national ID and email are unique
        if (tenantRepository.findByNationalId(tenant.getNationalId()) != null) {
            throw new IllegalArgumentException("A tenant with this national ID already exists");
        }
        if (tenantRepository.findByEmail(tenant.getEmail()) != null) {
            throw new IllegalArgumentException("A tenant with this email already exists");
        }

        // Set the owner
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));
        tenant.setOwner(owner);

        return tenantRepository.save(tenant);
    }

    @Override
    public List<Tenant> getAllTenants(@NonNull Long ownerId) {
        return tenantRepository.findByOwnerId(ownerId);
    }

    @Override
    public Optional<Tenant> getTenantById(@NonNull Long id, @NonNull Long ownerId) {
        return tenantRepository.findByIdAndOwnerId(id, ownerId);
    }

    @Override
    public Tenant updateTenant(@NonNull Long id, @NonNull Tenant tenant, @NonNull Long ownerId) {
        return tenantRepository.findByIdAndOwnerId(id, ownerId)
                .map(existingTenant -> {
                    // Check if national ID is being changed and if it's unique
                    if (!existingTenant.getNationalId().equals(tenant.getNationalId())) {
                        Tenant tenantWithSameNationalId = tenantRepository.findByNationalId(tenant.getNationalId());
                        if (tenantWithSameNationalId != null && !tenantWithSameNationalId.getId().equals(id)) {
                            throw new IllegalArgumentException("A tenant with this national ID already exists");
                        }
                    }

                    // Check if email is being changed and if it's unique
                    if (!existingTenant.getEmail().equals(tenant.getEmail())) {
                        Tenant tenantWithSameEmail = tenantRepository.findByEmail(tenant.getEmail());
                        if (tenantWithSameEmail != null && !tenantWithSameEmail.getId().equals(id)) {
                            throw new IllegalArgumentException("A tenant with this email already exists");
                        }
                    }

                    // Update fields
                    existingTenant.setFullName(tenant.getFullName());
                    existingTenant.setNationalId(tenant.getNationalId());
                    existingTenant.setEmail(tenant.getEmail());
                    existingTenant.setPhone(tenant.getPhone());

                    return tenantRepository.save(existingTenant);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + id));
    }

    @Override
    public void deleteTenant(@NonNull Long id, @NonNull Long ownerId) {
        Tenant tenant = tenantRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + id));
        tenantRepository.delete(tenant);
    }

    @Override
    public Optional<Tenant> getTenantByNationalId(String nationalId, @NonNull Long ownerId) {
        return tenantRepository.findByNationalIdAndOwnerId(nationalId, ownerId);
    }

    @Override
    public Optional<Tenant> getTenantByEmail(String email, @NonNull Long ownerId) {
        return tenantRepository.findByEmailAndOwnerId(email, ownerId);
    }

    @Override
    public Map<String, Object> canDelete(@NonNull Long id, @NonNull Long ownerId) {
        Map<String, Object> result = new HashMap<>();

        tenantRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + id));

        long leaseCount = leaseRepository.countByTenantIdAndDeletedFalse(id);

        if (leaseCount > 0) {
            result.put("canDelete", false);
            result.put("reason", "Este inquilino tiene " + leaseCount + " contrato(s) asociado(s). Debes eliminar primero los contratos antes de poder eliminar el inquilino.");
            result.put("leaseCount", leaseCount);
        } else {
            result.put("canDelete", true);
            result.put("reason", null);
            result.put("leaseCount", 0);
        }

        return result;
    }
}
