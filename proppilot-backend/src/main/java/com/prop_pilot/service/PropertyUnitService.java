package com.prop_pilot.service;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.User;
import org.springframework.lang.NonNull;

import java.util.List;

public interface PropertyUnitService {

    PropertyUnit createPropertyUnit(@NonNull PropertyUnit propertyUnit, @NonNull User owner);

    PropertyUnit getPropertyUnitById(@NonNull Long id, @NonNull Long ownerId);

    List<PropertyUnit> getAllPropertyUnits(@NonNull Long ownerId);

    List<PropertyUnit> getAllPropertyUnitsWithLeases(@NonNull Long ownerId);

    PropertyUnit updatePropertyUnit(@NonNull Long id, @NonNull PropertyUnit propertyUnit, @NonNull Long ownerId);

    void deletePropertyUnit(@NonNull Long id, @NonNull Long ownerId);

    List<PropertyUnit> searchPropertyUnits(String address, @NonNull Long ownerId);
}
