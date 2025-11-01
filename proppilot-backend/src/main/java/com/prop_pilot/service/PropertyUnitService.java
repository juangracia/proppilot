package com.prop_pilot.service;

import com.prop_pilot.entity.PropertyUnit;
import java.util.List;

public interface PropertyUnitService {
    PropertyUnit createPropertyUnit(PropertyUnit propertyUnit);
    PropertyUnit getPropertyUnitById(Long id);
    List<PropertyUnit> getAllPropertyUnits();
    List<PropertyUnit> getPropertyUnitsByTenant(Long tenantId);
    PropertyUnit updatePropertyUnit(Long id, PropertyUnit propertyUnit);
    void deletePropertyUnit(Long id);
    List<PropertyUnit> searchPropertyUnits(String address);
}
