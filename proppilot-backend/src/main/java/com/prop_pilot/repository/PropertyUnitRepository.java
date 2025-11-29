package com.prop_pilot.repository;

import com.prop_pilot.entity.PropertyUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long> {

    List<PropertyUnit> findByAddressContainingIgnoreCase(String address);

    List<PropertyUnit> findByOwnerId(Long ownerId);

    Optional<PropertyUnit> findByIdAndOwnerId(Long id, Long ownerId);

    List<PropertyUnit> findByAddressContainingIgnoreCaseAndOwnerId(String address, Long ownerId);

    @Query("SELECT DISTINCT pu FROM PropertyUnit pu " +
           "LEFT JOIN FETCH pu.leases l " +
           "WHERE pu.owner.id = :ownerId")
    List<PropertyUnit> findByOwnerIdWithLeases(@Param("ownerId") Long ownerId);
}
