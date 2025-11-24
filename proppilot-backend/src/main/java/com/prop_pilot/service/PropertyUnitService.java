package com.prop_pilot.service;

import com.prop_pilot.entity.PropertyUnit;
import org.springframework.lang.NonNull;
import java.util.List;

public interface PropertyUnitService {
    PropertyUnit createPropertyUnit(@NonNull PropertyUnit propertyUnit);
    PropertyUnit getPropertyUnitById(@NonNull Long id);
    List<PropertyUnit> getAllPropertyUnits();
    List<PropertyUnit> getPropertyUnitsByTenant(Long tenantId);
    PropertyUnit updatePropertyUnit(@NonNull Long id, PropertyUnit propertyUnit);
    void deletePropertyUnit(@NonNull Long id);
    List<PropertyUnit> searchPropertyUnits(String address);
}
