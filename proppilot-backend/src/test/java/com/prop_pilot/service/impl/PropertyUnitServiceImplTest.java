package com.prop_pilot.service.impl;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.repository.PropertyUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PropertyUnitServiceImplTest {

    @Mock
    private PropertyUnitRepository propertyUnitRepository;

    @InjectMocks
    private PropertyUnitServiceImpl propertyUnitService;

    private PropertyUnit testPropertyUnit;

    @BeforeEach
    void setUp() {
        testPropertyUnit = new PropertyUnit();
        testPropertyUnit.setId(1L);
        testPropertyUnit.setAddress("123 Test Street");
        testPropertyUnit.setType("Apartment");
        testPropertyUnit.setBaseRentAmount(new BigDecimal("1500.00"));
    }

    @Test
    void testCreatePropertyUnit_Success() {
        // Given
        PropertyUnit newPropertyUnit = new PropertyUnit();
        newPropertyUnit.setAddress("456 New Street");
        newPropertyUnit.setType("House");
        newPropertyUnit.setBaseRentAmount(new BigDecimal("2000.00"));

        when(propertyUnitRepository.save(any(PropertyUnit.class))).thenReturn(testPropertyUnit);

        // When
        PropertyUnit result = propertyUnitService.createPropertyUnit(newPropertyUnit);

        // Then
        assertNotNull(result);
        assertEquals(testPropertyUnit.getId(), result.getId());
        assertEquals(testPropertyUnit.getAddress(), result.getAddress());
        verify(propertyUnitRepository, times(1)).save(newPropertyUnit);
    }

    @Test
    void testGetPropertyUnitById_Success() {
        // Given
        Long propertyUnitId = 1L;
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.of(testPropertyUnit));

        // When
        PropertyUnit result = propertyUnitService.getPropertyUnitById(propertyUnitId);

        // Then
        assertNotNull(result);
        assertEquals(testPropertyUnit.getId(), result.getId());
        assertEquals(testPropertyUnit.getAddress(), result.getAddress());
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
    }

    @Test
    void testGetPropertyUnitById_NotFound() {
        // Given
        Long propertyUnitId = 999L;
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> propertyUnitService.getPropertyUnitById(propertyUnitId));
        
        assertEquals("Property unit not found with id: " + propertyUnitId, exception.getMessage());
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
    }

    @Test
    void testGetAllPropertyUnits_Success() {
        // Given
        PropertyUnit propertyUnit2 = new PropertyUnit();
        propertyUnit2.setId(2L);
        propertyUnit2.setAddress("789 Another Street");
        propertyUnit2.setType("Condo");
        propertyUnit2.setBaseRentAmount(new BigDecimal("1800.00"));

        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit, propertyUnit2);
        when(propertyUnitRepository.findAll()).thenReturn(propertyUnits);

        // When
        List<PropertyUnit> result = propertyUnitService.getAllPropertyUnits();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(testPropertyUnit.getId(), result.get(0).getId());
        assertEquals(propertyUnit2.getId(), result.get(1).getId());
        verify(propertyUnitRepository, times(1)).findAll();
    }

    @Test
    void testGetPropertyUnitsByTenant_Success() {
        // Given
        Long tenantId = 1L;
        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit);
        when(propertyUnitRepository.findByTenantId(tenantId)).thenReturn(propertyUnits);

        // When
        List<PropertyUnit> result = propertyUnitService.getPropertyUnitsByTenant(tenantId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testPropertyUnit.getId(), result.get(0).getId());
        verify(propertyUnitRepository, times(1)).findByTenantId(tenantId);
    }

    @Test
    void testUpdatePropertyUnit_Success() {
        // Given
        Long propertyUnitId = 1L;
        PropertyUnit updateData = new PropertyUnit();
        updateData.setAddress("Updated Address");
        updateData.setType("Updated Type");
        updateData.setBaseRentAmount(new BigDecimal("2500.00"));

        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.of(testPropertyUnit));
        when(propertyUnitRepository.save(any(PropertyUnit.class))).thenReturn(testPropertyUnit);

        // When
        PropertyUnit result = propertyUnitService.updatePropertyUnit(propertyUnitId, updateData);

        // Then
        assertNotNull(result);
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
        verify(propertyUnitRepository, times(1)).save(testPropertyUnit);
        
        // Verify that the testPropertyUnit was updated with new values
        assertEquals("Updated Address", testPropertyUnit.getAddress());
        assertEquals("Updated Type", testPropertyUnit.getType());
        assertEquals(new BigDecimal("2500.00"), testPropertyUnit.getBaseRentAmount());
    }

    @Test
    void testUpdatePropertyUnit_NotFound() {
        // Given
        Long propertyUnitId = 999L;
        PropertyUnit updateData = new PropertyUnit();
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> propertyUnitService.updatePropertyUnit(propertyUnitId, updateData));
        
        assertEquals("Property unit not found with id: " + propertyUnitId, exception.getMessage());
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
        verify(propertyUnitRepository, never()).save(any(PropertyUnit.class));
    }

    @Test
    void testDeletePropertyUnit_Success() {
        // Given
        Long propertyUnitId = 1L;
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.of(testPropertyUnit));

        // When
        propertyUnitService.deletePropertyUnit(propertyUnitId);

        // Then
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
        verify(propertyUnitRepository, times(1)).delete(testPropertyUnit);
    }

    @Test
    void testDeletePropertyUnit_NotFound() {
        // Given
        Long propertyUnitId = 999L;
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> propertyUnitService.deletePropertyUnit(propertyUnitId));
        
        assertEquals("Property unit not found with id: " + propertyUnitId, exception.getMessage());
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
        verify(propertyUnitRepository, never()).delete(any(PropertyUnit.class));
    }

    @Test
    void testSearchPropertyUnits_Success() {
        // Given
        String searchAddress = "test";
        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit);
        when(propertyUnitRepository.findByAddressContainingIgnoreCase(searchAddress)).thenReturn(propertyUnits);

        // When
        List<PropertyUnit> result = propertyUnitService.searchPropertyUnits(searchAddress);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testPropertyUnit.getId(), result.get(0).getId());
        verify(propertyUnitRepository, times(1)).findByAddressContainingIgnoreCase(searchAddress);
    }

    @Test
    void testSearchPropertyUnits_EmptyResult() {
        // Given
        String searchAddress = "nonexistent";
        when(propertyUnitRepository.findByAddressContainingIgnoreCase(searchAddress)).thenReturn(Arrays.asList());

        // When
        List<PropertyUnit> result = propertyUnitService.searchPropertyUnits(searchAddress);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(propertyUnitRepository, times(1)).findByAddressContainingIgnoreCase(searchAddress);
    }
}
