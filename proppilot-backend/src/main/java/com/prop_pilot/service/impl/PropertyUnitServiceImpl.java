package com.prop_pilot.service.impl;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.User;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.service.PropertyUnitService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PropertyUnitServiceImpl implements PropertyUnitService {

    private final PropertyUnitRepository propertyUnitRepository;
    private final LeaseRepository leaseRepository;

    public PropertyUnitServiceImpl(PropertyUnitRepository propertyUnitRepository, LeaseRepository leaseRepository) {
        this.propertyUnitRepository = propertyUnitRepository;
        this.leaseRepository = leaseRepository;
    }

    @Override
    @Transactional
    public PropertyUnit createPropertyUnit(@NonNull PropertyUnit propertyUnit, @NonNull User owner) {
        propertyUnit.setOwner(owner);
        return propertyUnitRepository.save(propertyUnit);
    }

    @Override
    public PropertyUnit getPropertyUnitById(@NonNull Long id, @NonNull Long ownerId) {
        return propertyUnitRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + id));
    }

    @Override
    public List<PropertyUnit> getAllPropertyUnits(@NonNull Long ownerId) {
        return propertyUnitRepository.findByOwnerId(ownerId);
    }

    @Override
    public List<PropertyUnit> getAllPropertyUnitsWithLeases(@NonNull Long ownerId) {
        return propertyUnitRepository.findByOwnerIdWithLeases(ownerId);
    }

    @Override
    @Transactional
    public PropertyUnit updatePropertyUnit(@NonNull Long id, @NonNull PropertyUnit propertyUnit, @NonNull Long ownerId) {
        PropertyUnit existingPropertyUnit = getPropertyUnitById(id, ownerId);

        if (propertyUnit.getAddress() != null) {
            existingPropertyUnit.setAddress(propertyUnit.getAddress());
        }
        if (propertyUnit.getType() != null) {
            existingPropertyUnit.setType(propertyUnit.getType());
        }
        if (propertyUnit.getBaseRentAmount() != null) {
            existingPropertyUnit.setBaseRentAmount(propertyUnit.getBaseRentAmount());
        }

        return propertyUnitRepository.save(existingPropertyUnit);
    }

    @Override
    @Transactional
    public void deletePropertyUnit(@NonNull Long id, @NonNull Long ownerId) {
        PropertyUnit propertyUnit = getPropertyUnitById(id, ownerId);

        // Don't allow deletion if there are active leases
        if (propertyUnit.getLeases() != null && !propertyUnit.getLeases().isEmpty()) {
            throw new BusinessLogicException("Cannot delete property unit with existing leases");
        }

        propertyUnitRepository.delete(propertyUnit);
    }

    @Override
    public List<PropertyUnit> searchPropertyUnits(String address, @NonNull Long ownerId) {
        return propertyUnitRepository.findByAddressContainingIgnoreCaseAndOwnerId(address, ownerId);
    }

    @Override
    public Map<String, Object> canDelete(@NonNull Long id, @NonNull Long ownerId) {
        Map<String, Object> result = new HashMap<>();

        propertyUnitRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + id));

        long leaseCount = leaseRepository.countByPropertyUnitIdAndDeletedFalse(id);

        if (leaseCount > 0) {
            result.put("canDelete", false);
            result.put("reason", "Esta propiedad tiene " + leaseCount + " contrato(s) asociado(s). Debes eliminar primero los contratos antes de poder eliminar la propiedad.");
            result.put("leaseCount", leaseCount);
        } else {
            result.put("canDelete", true);
            result.put("reason", null);
            result.put("leaseCount", 0);
        }

        return result;
    }
}
