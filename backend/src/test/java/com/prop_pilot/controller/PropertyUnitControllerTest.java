package com.prop_pilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.service.PropertyUnitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PropertyUnitController.class)
class PropertyUnitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PropertyUnitService propertyUnitService;

    @Autowired
    private ObjectMapper objectMapper;

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
    void testCreatePropertyUnit_Success() throws Exception {
        // Given
        PropertyUnit newPropertyUnit = new PropertyUnit();
        newPropertyUnit.setAddress("456 New Street");
        newPropertyUnit.setType("House");
        newPropertyUnit.setBaseRentAmount(new BigDecimal("2000.00"));

        when(propertyUnitService.createPropertyUnit(any(PropertyUnit.class))).thenReturn(testPropertyUnit);

        // When & Then
        mockMvc.perform(post("/api/property-units")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPropertyUnit)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testPropertyUnit.getId()))
                .andExpect(jsonPath("$.address").value(testPropertyUnit.getAddress()))
                .andExpect(jsonPath("$.type").value(testPropertyUnit.getType()))
                .andExpect(jsonPath("$.baseRentAmount").value(testPropertyUnit.getBaseRentAmount().doubleValue()));

        verify(propertyUnitService, times(1)).createPropertyUnit(any(PropertyUnit.class));
    }

    @Test
    void testGetPropertyUnitById_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        when(propertyUnitService.getPropertyUnitById(propertyUnitId)).thenReturn(testPropertyUnit);

        // When & Then
        mockMvc.perform(get("/api/property-units/{id}", propertyUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPropertyUnit.getId()))
                .andExpect(jsonPath("$.address").value(testPropertyUnit.getAddress()))
                .andExpect(jsonPath("$.type").value(testPropertyUnit.getType()))
                .andExpect(jsonPath("$.baseRentAmount").value(testPropertyUnit.getBaseRentAmount().doubleValue()));

        verify(propertyUnitService, times(1)).getPropertyUnitById(propertyUnitId);
    }

    @Test
    void testGetPropertyUnitById_NotFound() throws Exception {
        // Given
        Long propertyUnitId = 999L;
        when(propertyUnitService.getPropertyUnitById(propertyUnitId))
                .thenThrow(new RuntimeException("Property unit not found with id: " + propertyUnitId));

        // When & Then
        mockMvc.perform(get("/api/property-units/{id}", propertyUnitId))
                .andExpect(status().is5xxServerError());

        verify(propertyUnitService, times(1)).getPropertyUnitById(propertyUnitId);
    }

    @Test
    void testGetAllPropertyUnits_Success() throws Exception {
        // Given
        PropertyUnit propertyUnit2 = new PropertyUnit();
        propertyUnit2.setId(2L);
        propertyUnit2.setAddress("789 Another Street");
        propertyUnit2.setType("Condo");
        propertyUnit2.setBaseRentAmount(new BigDecimal("1800.00"));

        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit, propertyUnit2);
        when(propertyUnitService.getAllPropertyUnits()).thenReturn(propertyUnits);

        // When & Then
        mockMvc.perform(get("/api/property-units"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(testPropertyUnit.getId()))
                .andExpect(jsonPath("$[0].address").value(testPropertyUnit.getAddress()))
                .andExpect(jsonPath("$[1].id").value(propertyUnit2.getId()))
                .andExpect(jsonPath("$[1].address").value(propertyUnit2.getAddress()));

        verify(propertyUnitService, times(1)).getAllPropertyUnits();
    }

    @Test
    void testGetPropertyUnitsByTenant_Success() throws Exception {
        // Given
        Long tenantId = 1L;
        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit);
        when(propertyUnitService.getPropertyUnitsByTenant(tenantId)).thenReturn(propertyUnits);

        // When & Then
        mockMvc.perform(get("/api/property-units/tenant/{tenantId}", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(testPropertyUnit.getId()))
                .andExpect(jsonPath("$[0].address").value(testPropertyUnit.getAddress()));

        verify(propertyUnitService, times(1)).getPropertyUnitsByTenant(tenantId);
    }

    @Test
    void testSearchPropertyUnits_Success() throws Exception {
        // Given
        String searchAddress = "test";
        List<PropertyUnit> propertyUnits = Arrays.asList(testPropertyUnit);
        when(propertyUnitService.searchPropertyUnits(searchAddress)).thenReturn(propertyUnits);

        // When & Then
        mockMvc.perform(get("/api/property-units/search")
                .param("address", searchAddress))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(testPropertyUnit.getId()))
                .andExpect(jsonPath("$[0].address").value(testPropertyUnit.getAddress()));

        verify(propertyUnitService, times(1)).searchPropertyUnits(searchAddress);
    }

    @Test
    void testUpdatePropertyUnit_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        PropertyUnit updateData = new PropertyUnit();
        updateData.setAddress("Updated Address");
        updateData.setType("Updated Type");
        updateData.setBaseRentAmount(new BigDecimal("2500.00"));

        PropertyUnit updatedPropertyUnit = new PropertyUnit();
        updatedPropertyUnit.setId(propertyUnitId);
        updatedPropertyUnit.setAddress("Updated Address");
        updatedPropertyUnit.setType("Updated Type");
        updatedPropertyUnit.setBaseRentAmount(new BigDecimal("2500.00"));

        when(propertyUnitService.updatePropertyUnit(eq(propertyUnitId), any(PropertyUnit.class)))
                .thenReturn(updatedPropertyUnit);

        // When & Then
        mockMvc.perform(put("/api/property-units/{id}", propertyUnitId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedPropertyUnit.getId()))
                .andExpect(jsonPath("$.address").value(updatedPropertyUnit.getAddress()))
                .andExpect(jsonPath("$.type").value(updatedPropertyUnit.getType()))
                .andExpect(jsonPath("$.baseRentAmount").value(updatedPropertyUnit.getBaseRentAmount().doubleValue()));

        verify(propertyUnitService, times(1)).updatePropertyUnit(eq(propertyUnitId), any(PropertyUnit.class));
    }

    @Test
    void testDeletePropertyUnit_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        doNothing().when(propertyUnitService).deletePropertyUnit(propertyUnitId);

        // When & Then
        mockMvc.perform(delete("/api/property-units/{id}", propertyUnitId))
                .andExpect(status().isNoContent());

        verify(propertyUnitService, times(1)).deletePropertyUnit(propertyUnitId);
    }

    @Test
    void testDeletePropertyUnit_NotFound() throws Exception {
        // Given
        Long propertyUnitId = 999L;
        doThrow(new RuntimeException("Property unit not found with id: " + propertyUnitId))
                .when(propertyUnitService).deletePropertyUnit(propertyUnitId);

        // When & Then
        mockMvc.perform(delete("/api/property-units/{id}", propertyUnitId))
                .andExpect(status().is5xxServerError());

        verify(propertyUnitService, times(1)).deletePropertyUnit(propertyUnitId);
    }
}
