package com.prop_pilot.service;

import com.prop_pilot.entity.Tenant;
import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

public interface TenantService {

    Tenant createTenant(Tenant tenant);

    List<Tenant> getAllTenants(@NonNull Long ownerId);

    Optional<Tenant> getTenantById(@NonNull Long id, @NonNull Long ownerId);

    Tenant updateTenant(@NonNull Long id, @NonNull Tenant tenant, @NonNull Long ownerId);

    void deleteTenant(@NonNull Long id, @NonNull Long ownerId);

    Optional<Tenant> getTenantByNationalId(String nationalId, @NonNull Long ownerId);

    Optional<Tenant> getTenantByEmail(String email, @NonNull Long ownerId);
}
