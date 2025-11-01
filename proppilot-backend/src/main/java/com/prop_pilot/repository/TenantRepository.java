package com.prop_pilot.repository;

import com.prop_pilot.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Tenant findByNationalId(String nationalId);
    Tenant findByEmail(String email);
}
