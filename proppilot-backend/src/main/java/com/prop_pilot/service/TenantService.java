package com.prop_pilot.service;

import com.prop_pilot.entity.Tenant;
import java.util.List;
import java.util.Optional;

public interface TenantService {
    
    /**
     * Creates a new tenant
     * @param tenant the tenant to create
     * @return the created tenant
     */
    Tenant createTenant(Tenant tenant);
    
    /**
     * Retrieves all tenants
     * @return list of all tenants
     */
    List<Tenant> getAllTenants();
    
    /**
     * Retrieves a tenant by ID
     * @param id the tenant ID
     * @return the tenant if found
     */
    Optional<Tenant> getTenantById(Long id);
    
    /**
     * Updates an existing tenant
     * @param id the tenant ID
     * @param tenant the updated tenant data
     * @return the updated tenant
     */
    Tenant updateTenant(Long id, Tenant tenant);
    
    /**
     * Deletes a tenant by ID
     * @param id the tenant ID
     */
    void deleteTenant(Long id);
    
    /**
     * Finds a tenant by national ID
     * @param nationalId the national ID
     * @return the tenant if found
     */
    Optional<Tenant> getTenantByNationalId(String nationalId);
    
    /**
     * Finds a tenant by email
     * @param email the email
     * @return the tenant if found
     */
    Optional<Tenant> getTenantByEmail(String email);
}
