package com.prop_pilot.controller;

import com.prop_pilot.entity.Lease;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.LeaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leases")
@Tag(name = "Leases", description = "API for managing lease contracts")
public class LeaseController {

    private final LeaseService leaseService;
    private final CurrentUserService currentUserService;

    public LeaseController(LeaseService leaseService, CurrentUserService currentUserService) {
        this.leaseService = leaseService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Create a new lease", description = "Creates a new lease contract between a tenant and a property")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Lease created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid lease data or overlapping lease exists")
    })
    public ResponseEntity<Lease> createLease(@Valid @RequestBody Lease lease) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease createdLease = leaseService.createLease(lease, ownerId);
        return new ResponseEntity<>(createdLease, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lease by ID", description = "Retrieves a specific lease by its ID")
    @ApiResponse(responseCode = "200", description = "Lease retrieved successfully")
    public ResponseEntity<Lease> getLeaseById(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease lease = leaseService.getLeaseById(id, ownerId);
        return ResponseEntity.ok(lease);
    }

    @GetMapping
    @Operation(summary = "Get all leases", description = "Retrieves all leases for the current landlord")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all leases")
    public ResponseEntity<List<Lease>> getAllLeases() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getAllLeases(ownerId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active leases", description = "Retrieves all currently active leases")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved active leases")
    public ResponseEntity<List<Lease>> getActiveLeases() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getActiveLeases(ownerId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/property-unit/{propertyUnitId}")
    @Operation(summary = "Get leases by property unit", description = "Retrieves all leases for a specific property unit")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved leases for property unit")
    public ResponseEntity<List<Lease>> getLeasesByPropertyUnit(@PathVariable Long propertyUnitId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getLeasesByPropertyUnit(propertyUnitId, ownerId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/property-unit/{propertyUnitId}/active")
    @Operation(summary = "Get active lease by property unit", description = "Retrieves the current active lease for a property unit")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved active lease")
    public ResponseEntity<Lease> getActiveLeaseByPropertyUnit(@PathVariable Long propertyUnitId) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease lease = leaseService.getActiveLeaseByPropertyUnit(propertyUnitId, ownerId);
        return ResponseEntity.ok(lease);
    }

    @GetMapping("/tenant/{tenantId}")
    @Operation(summary = "Get leases by tenant", description = "Retrieves all leases for a specific tenant")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved leases for tenant")
    public ResponseEntity<List<Lease>> getLeasesByTenant(@PathVariable Long tenantId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getLeasesByTenant(tenantId, ownerId);
        return ResponseEntity.ok(leases);
    }

    @GetMapping("/tenant/{tenantId}/active")
    @Operation(summary = "Get active lease by tenant", description = "Retrieves the current active lease for a tenant")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved active lease")
    public ResponseEntity<Lease> getActiveLeaseByTenant(@PathVariable Long tenantId) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease lease = leaseService.getActiveLeaseByTenant(tenantId, ownerId);
        return ResponseEntity.ok(lease);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update lease", description = "Updates an existing lease")
    @ApiResponse(responseCode = "200", description = "Lease updated successfully")
    public ResponseEntity<Lease> updateLease(@PathVariable Long id, @RequestBody Lease lease) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease updatedLease = leaseService.updateLease(id, lease, ownerId);
        return ResponseEntity.ok(updatedLease);
    }

    @PostMapping("/{id}/terminate")
    @Operation(summary = "Terminate lease", description = "Terminates an active lease")
    @ApiResponse(responseCode = "200", description = "Lease terminated successfully")
    public ResponseEntity<Void> terminateLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.terminateLease(id, ownerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete lease", description = "Deletes a lease (only if no payments exist)")
    @ApiResponse(responseCode = "204", description = "Lease deleted successfully")
    public ResponseEntity<Void> deleteLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.deleteLease(id, ownerId);
        return ResponseEntity.noContent().build();
    }
}
