package com.prop_pilot.service.impl;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.User;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.service.PropertyUnitService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PropertyUnitServiceImpl implements PropertyUnitService {

    private final PropertyUnitRepository propertyUnitRepository;

    public PropertyUnitServiceImpl(PropertyUnitRepository propertyUnitRepository) {
        this.propertyUnitRepository = propertyUnitRepository;
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
}
