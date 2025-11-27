package com.mirent.service.impl;

import com.mirent.entity.PropertyUnit;
import com.mirent.entity.User;
import com.mirent.exception.ResourceNotFoundException;
import com.mirent.exception.ValidationException;
import com.mirent.repository.PropertyUnitRepository;
import com.mirent.service.PropertyUnitService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PropertyUnitServiceImpl implements PropertyUnitService {

    private final PropertyUnitRepository propertyUnitRepository;

    public PropertyUnitServiceImpl(PropertyUnitRepository propertyUnitRepository) {
        this.propertyUnitRepository = propertyUnitRepository;
    }

    @Override
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
    public List<PropertyUnit> getPropertyUnitsByTenant(Long tenantId, @NonNull Long ownerId) {
        return propertyUnitRepository.findByTenantIdAndOwnerId(tenantId, ownerId);
    }

    @Override
    public PropertyUnit updatePropertyUnit(@NonNull Long id, PropertyUnit propertyUnit, @NonNull Long ownerId) {
        PropertyUnit existingPropertyUnit = getPropertyUnitById(id, ownerId);

        // Validate business rules
        if (propertyUnit.getBaseRentAmount() != null && propertyUnit.getBaseRentAmount().compareTo(existingPropertyUnit.getBaseRentAmount()) < 0) {
            throw new ValidationException("New rent amount cannot be lower than current rent amount");
        }

        existingPropertyUnit.setAddress(propertyUnit.getAddress());
        existingPropertyUnit.setType(propertyUnit.getType());
        existingPropertyUnit.setBaseRentAmount(propertyUnit.getBaseRentAmount());
        existingPropertyUnit.setLeaseStartDate(propertyUnit.getLeaseStartDate());
        existingPropertyUnit.setTenant(propertyUnit.getTenant());
        return propertyUnitRepository.save(existingPropertyUnit);
    }

    @Override
    public void deletePropertyUnit(@NonNull Long id, @NonNull Long ownerId) {
        PropertyUnit propertyUnit = getPropertyUnitById(id, ownerId);
        propertyUnitRepository.delete(propertyUnit);
    }

    @Override
    public List<PropertyUnit> searchPropertyUnits(String address, @NonNull Long ownerId) {
        return propertyUnitRepository.findByAddressContainingIgnoreCaseAndOwnerId(address, ownerId);
    }
}
