package com.prop_pilot.controller;

import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.entity.User;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.PropertyUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/property-units")
@Tag(name = "Property Units", description = "API for managing rental property units")
public class PropertyUnitController {

    private final PropertyUnitService propertyUnitService;
    private final CurrentUserService currentUserService;

    public PropertyUnitController(PropertyUnitService propertyUnitService, CurrentUserService currentUserService) {
        this.propertyUnitService = propertyUnitService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Create a new property unit", description = "Creates a new rental property unit in the system")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Property unit created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<PropertyUnit> createPropertyUnit(@Valid @RequestBody @NonNull PropertyUnit propertyUnit) {
        User owner = currentUserService.getCurrentUser();
        PropertyUnit createdPropertyUnit = propertyUnitService.createPropertyUnit(propertyUnit, owner);
        return new ResponseEntity<>(createdPropertyUnit, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a property unit by ID", description = "Retrieves a property unit by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Property unit retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Property unit not found")
    })
    public ResponseEntity<PropertyUnit> getPropertyUnitById(@PathVariable @NonNull Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        PropertyUnit propertyUnit = propertyUnitService.getPropertyUnitById(id, ownerId);
        return ResponseEntity.ok(propertyUnit);
    }

    @GetMapping
    @Operation(summary = "Get all property units", description = "Retrieves a list of all property units owned by the current user")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all property units")
    public ResponseEntity<List<PropertyUnit>> getAllPropertyUnits() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<PropertyUnit> propertyUnits = propertyUnitService.getAllPropertyUnits(ownerId);
        return ResponseEntity.ok(propertyUnits);
    }

    @GetMapping("/with-leases")
    @Operation(summary = "Get all property units with leases", description = "Retrieves all property units with their associated leases")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved property units with leases")
    public ResponseEntity<List<PropertyUnit>> getAllPropertyUnitsWithLeases() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<PropertyUnit> propertyUnits = propertyUnitService.getAllPropertyUnitsWithLeases(ownerId);
        return ResponseEntity.ok(propertyUnits);
    }

    @GetMapping("/search")
    @Operation(summary = "Search property units by address", description = "Search for property units by address")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved matching property units")
    public ResponseEntity<List<PropertyUnit>> searchPropertyUnits(
            @Parameter(description = "Address to search for") @RequestParam String address) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<PropertyUnit> propertyUnits = propertyUnitService.searchPropertyUnits(address, ownerId);
        return ResponseEntity.ok(propertyUnits);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a property unit", description = "Updates an existing property unit")
    @ApiResponse(responseCode = "200", description = "Property unit updated successfully")
    public ResponseEntity<PropertyUnit> updatePropertyUnit(@PathVariable @NonNull Long id, @Valid @RequestBody PropertyUnit propertyUnit) {
        Long ownerId = currentUserService.getCurrentUserId();
        PropertyUnit updatedPropertyUnit = propertyUnitService.updatePropertyUnit(id, propertyUnit, ownerId);
        return ResponseEntity.ok(updatedPropertyUnit);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a property unit", description = "Deletes a property unit (only if no leases exist)")
    @ApiResponse(responseCode = "204", description = "Property unit deleted successfully")
    public ResponseEntity<Void> deletePropertyUnit(@PathVariable @NonNull Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        propertyUnitService.deletePropertyUnit(id, ownerId);
        return ResponseEntity.noContent().build();
    }
}
