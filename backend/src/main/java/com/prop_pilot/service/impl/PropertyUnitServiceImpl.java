package com.prop_pilot.service.impl;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.exception.ValidationException;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.service.PropertyUnitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PropertyUnitServiceImpl implements PropertyUnitService {

    @Autowired
    private PropertyUnitRepository propertyUnitRepository;

    @Override
    public PropertyUnit createPropertyUnit(PropertyUnit propertyUnit) {
        return propertyUnitRepository.save(propertyUnit);
    }

    @Override
    public PropertyUnit getPropertyUnitById(Long id) {
        return propertyUnitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + id));
    }

    @Override
    public List<PropertyUnit> getAllPropertyUnits() {
        return propertyUnitRepository.findAll();
    }

    @Override
    public List<PropertyUnit> getPropertyUnitsByTenant(Long tenantId) {
        return propertyUnitRepository.findByTenantId(tenantId);
    }

    @Override
    public PropertyUnit updatePropertyUnit(Long id, PropertyUnit propertyUnit) {
        PropertyUnit existingPropertyUnit = getPropertyUnitById(id);
        
        // Validate business rules
        if (propertyUnit.getBaseRentAmount() != null && propertyUnit.getBaseRentAmount().compareTo(existingPropertyUnit.getBaseRentAmount()) < 0) {
            throw new ValidationException("New rent amount cannot be lower than current rent amount");
        }
        
        existingPropertyUnit.setAddress(propertyUnit.getAddress());
        existingPropertyUnit.setType(propertyUnit.getType());
        existingPropertyUnit.setBaseRentAmount(propertyUnit.getBaseRentAmount());
        existingPropertyUnit.setLeaseStartDate(propertyUnit.getLeaseStartDate());
        return propertyUnitRepository.save(existingPropertyUnit);
    }

    @Override
    public void deletePropertyUnit(Long id) {
        PropertyUnit propertyUnit = getPropertyUnitById(id);
        propertyUnitRepository.delete(propertyUnit);
    }

    @Override
    public List<PropertyUnit> searchPropertyUnits(String address) {
        return propertyUnitRepository.findByAddressContainingIgnoreCase(address);
    }
}
