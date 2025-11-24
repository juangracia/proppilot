package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Tenant;
import com.prop_pilot.repository.TenantRepository;
import com.prop_pilot.service.TenantService;
import com.prop_pilot.exception.ResourceNotFoundException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;

    public TenantServiceImpl(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Tenant createTenant(Tenant tenant) {
        // Validate that national ID and email are unique
        if (tenantRepository.findByNationalId(tenant.getNationalId()) != null) {
            throw new IllegalArgumentException("A tenant with this national ID already exists");
        }
        if (tenantRepository.findByEmail(tenant.getEmail()) != null) {
            throw new IllegalArgumentException("A tenant with this email already exists");
        }
        return tenantRepository.save(tenant);
    }

    @Override
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    @Override
    public Optional<Tenant> getTenantById(@NonNull Long id) {
        return tenantRepository.findById(id);
    }

    @Override
    public Tenant updateTenant(@NonNull Long id, @NonNull Tenant tenant) {
        return tenantRepository.findById(id)
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
    public void deleteTenant(@NonNull Long id) {
        if (!tenantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tenant not found with id: " + id);
        }
        tenantRepository.deleteById(id);
    }

    @Override
    public Optional<Tenant> getTenantByNationalId(String nationalId) {
        return Optional.ofNullable(tenantRepository.findByNationalId(nationalId));
    }

    @Override
    public Optional<Tenant> getTenantByEmail(String email) {
        return Optional.ofNullable(tenantRepository.findByEmail(email));
    }
}
