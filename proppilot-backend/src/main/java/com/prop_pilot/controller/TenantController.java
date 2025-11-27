package com.prop_pilot.controller;

import com.prop_pilot.entity.Tenant;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.TenantService;
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
import java.util.Optional;

@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Tenants", description = "API for managing tenants")
public class TenantController {

    private final TenantService tenantService;
    private final CurrentUserService currentUserService;

    public TenantController(TenantService tenantService, CurrentUserService currentUserService) {
        this.tenantService = tenantService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Create a new tenant", description = "Creates a new tenant in the system")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Tenant created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data or duplicate national ID/email")
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        description = "Tenant data",
        content = @io.swagger.v3.oas.annotations.media.Content(
            mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                name = "New Tenant",
                value = "{\"fullName\": \"Juan Pérez\", \"nationalId\": \"12345678\", \"email\": \"juan.perez@email.com\", \"phone\": \"+54 9 11 1234-5678\"}"
            )
        )
    )
    public ResponseEntity<Tenant> createTenant(@Valid @RequestBody Tenant tenant) {
        try {
            Tenant createdTenant = tenantService.createTenant(tenant);
            return new ResponseEntity<>(createdTenant, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    @Operation(summary = "Get all tenants", description = "Retrieves a list of all tenants for the current landlord")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tenants retrieved successfully")
    })
    public ResponseEntity<List<Tenant>> getAllTenants() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Tenant> tenants = tenantService.getAllTenants(ownerId);
        return new ResponseEntity<>(tenants, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a tenant by ID", description = "Retrieves a tenant by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tenant retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<Tenant> getTenantById(
            @Parameter(description = "Tenant ID", required = true)
            @PathVariable @NonNull Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        Optional<Tenant> tenant = tenantService.getTenantById(id, ownerId);
        return tenant.map(t -> new ResponseEntity<>(t, HttpStatus.OK))
                    .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a tenant", description = "Updates an existing tenant")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tenant updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data or duplicate national ID/email"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        description = "Updated tenant data",
        content = @io.swagger.v3.oas.annotations.media.Content(
            mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                name = "Updated Tenant",
                value = "{\"fullName\": \"Juan Carlos Pérez\", \"nationalId\": \"12345678\", \"email\": \"juan.carlos@email.com\", \"phone\": \"+54 9 11 8765-4321\"}"
            )
        )
    )
    public ResponseEntity<Tenant> updateTenant(
            @Parameter(description = "Tenant ID", required = true)
            @PathVariable @NonNull Long id,
            @Valid @RequestBody @NonNull Tenant tenant) {
        try {
            Long ownerId = currentUserService.getCurrentUserId();
            Tenant updatedTenant = tenantService.updateTenant(id, tenant, ownerId);
            return new ResponseEntity<>(updatedTenant, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a tenant", description = "Deletes a tenant by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Tenant deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<Void> deleteTenant(
            @Parameter(description = "Tenant ID", required = true)
            @PathVariable @NonNull Long id) {
        try {
            Long ownerId = currentUserService.getCurrentUserId();
            tenantService.deleteTenant(id, ownerId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/search/national-id/{nationalId}")
    @Operation(summary = "Find tenant by national ID", description = "Retrieves a tenant by their national ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<Tenant> getTenantByNationalId(
            @Parameter(description = "National ID", required = true)
            @PathVariable String nationalId) {
        Long ownerId = currentUserService.getCurrentUserId();
        Optional<Tenant> tenant = tenantService.getTenantByNationalId(nationalId, ownerId);
        return tenant.map(t -> new ResponseEntity<>(t, HttpStatus.OK))
                    .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/search/email/{email}")
    @Operation(summary = "Find tenant by email", description = "Retrieves a tenant by their email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tenant found"),
        @ApiResponse(responseCode = "404", description = "Tenant not found")
    })
    public ResponseEntity<Tenant> getTenantByEmail(
            @Parameter(description = "Email", required = true)
            @PathVariable String email) {
        Long ownerId = currentUserService.getCurrentUserId();
        Optional<Tenant> tenant = tenantService.getTenantByEmail(email, ownerId);
        return tenant.map(t -> new ResponseEntity<>(t, HttpStatus.OK))
                    .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}
