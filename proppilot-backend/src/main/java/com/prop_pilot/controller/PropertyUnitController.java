package com.prop_pilot.controller;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.service.PropertyUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/property-units")
@Tag(name = "Property Units", description = "API for managing rental property units")
public class PropertyUnitController {

    @Autowired
    private PropertyUnitService propertyUnitService;

    @PostMapping
    @Operation(summary = "Create a new property unit", description = "Creates a new rental property unit in the system")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Property unit created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<PropertyUnit> createPropertyUnit(@Valid @RequestBody PropertyUnit propertyUnit) {
        PropertyUnit createdPropertyUnit = propertyUnitService.createPropertyUnit(propertyUnit);
        return new ResponseEntity<>(createdPropertyUnit, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a property unit by ID", description = "Retrieves a property unit by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Property unit retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Property unit not found")
    })
    public ResponseEntity<PropertyUnit> getPropertyUnitById(@PathVariable Long id) {
        PropertyUnit propertyUnit = propertyUnitService.getPropertyUnitById(id);
        return ResponseEntity.ok(propertyUnit);
    }

    @GetMapping
    @Operation(summary = "Get all property units", description = "Retrieves a list of all property units in the system")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all property units")
    public ResponseEntity<List<PropertyUnit>> getAllPropertyUnits() {
        List<PropertyUnit> propertyUnits = propertyUnitService.getAllPropertyUnits();
        return ResponseEntity.ok(propertyUnits);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<PropertyUnit>> getPropertyUnitsByTenant(@PathVariable Long tenantId) {
        List<PropertyUnit> propertyUnits = propertyUnitService.getPropertyUnitsByTenant(tenantId);
        return ResponseEntity.ok(propertyUnits);
    }

    @GetMapping("/search")
    @Operation(summary = "Search property units by address", description = "Search for property units by address")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved matching property units")
    public ResponseEntity<List<PropertyUnit>> searchPropertyUnits(
            @Parameter(description = "Address to search for") @RequestParam String address) {
        List<PropertyUnit> propertyUnits = propertyUnitService.searchPropertyUnits(address);
        return ResponseEntity.ok(propertyUnits);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PropertyUnit> updatePropertyUnit(@PathVariable Long id, @Valid @RequestBody PropertyUnit propertyUnit) {
        PropertyUnit updatedPropertyUnit = propertyUnitService.updatePropertyUnit(id, propertyUnit);
        return ResponseEntity.ok(updatedPropertyUnit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePropertyUnit(@PathVariable Long id) {
        propertyUnitService.deletePropertyUnit(id);
        return ResponseEntity.noContent().build();
    }
}
