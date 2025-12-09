package com.prop_pilot.controller;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.IndexValueService;
import com.prop_pilot.service.LeaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/leases")
@Tag(name = "Leases", description = "API for managing lease contracts")
public class LeaseController {

    private final LeaseService leaseService;
    private final CurrentUserService currentUserService;
    private final IndexValueService indexValueService;

    private static final Map<Lease.AdjustmentIndex, IndexValue.IndexType> ADJUSTMENT_TO_INDEX_TYPE = Map.of(
        Lease.AdjustmentIndex.ICL, IndexValue.IndexType.ICL,
        Lease.AdjustmentIndex.IPC, IndexValue.IndexType.IPC,
        Lease.AdjustmentIndex.DOLAR_BLUE, IndexValue.IndexType.DOLAR_BLUE,
        Lease.AdjustmentIndex.DOLAR_OFICIAL, IndexValue.IndexType.DOLAR_OFICIAL,
        Lease.AdjustmentIndex.DOLAR_MEP, IndexValue.IndexType.DOLAR_MEP
    );

    public LeaseController(LeaseService leaseService, CurrentUserService currentUserService,
                           IndexValueService indexValueService) {
        this.leaseService = leaseService;
        this.currentUserService = currentUserService;
        this.indexValueService = indexValueService;
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
    @Operation(summary = "Get active leases by tenant", description = "Retrieves all current active leases for a tenant")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved active leases")
    public ResponseEntity<List<Lease>> getActiveLeasesByTenant(@PathVariable Long tenantId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getActiveLeasesByTenant(tenantId, ownerId);
        return ResponseEntity.ok(leases);
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

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate lease", description = "Reactivates a terminated lease")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lease reactivated successfully"),
        @ApiResponse(responseCode = "400", description = "Cannot reactivate: overlapping lease exists or lease is not terminated")
    })
    public ResponseEntity<Void> reactivateLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.reactivateLease(id, ownerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete lease", description = "Soft deletes a lease (can be restored later)")
    @ApiResponse(responseCode = "204", description = "Lease soft deleted successfully")
    public ResponseEntity<Void> deleteLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.softDeleteLease(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/deleted")
    @Operation(summary = "Get deleted leases", description = "Retrieves all soft-deleted leases for the current landlord")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved deleted leases")
    public ResponseEntity<List<Lease>> getDeletedLeases() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Lease> leases = leaseService.getDeletedLeases(ownerId);
        return ResponseEntity.ok(leases);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore lease", description = "Restores a soft-deleted lease")
    @ApiResponse(responseCode = "200", description = "Lease restored successfully")
    public ResponseEntity<Void> restoreLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.restoreLease(id, ownerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently delete lease", description = "Permanently deletes a soft-deleted lease (cannot be restored)")
    @ApiResponse(responseCode = "204", description = "Lease permanently deleted")
    public ResponseEntity<Void> permanentlyDeleteLease(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        leaseService.permanentlyDeleteLease(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/adjusted-rent")
    @Operation(summary = "Calculate adjusted rent", description = "Calculates the adjusted rent for a lease based on the adjustment index. Returns the base rent if no adjustment is configured.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Adjusted rent calculated successfully"),
        @ApiResponse(responseCode = "404", description = "Lease not found")
    })
    public ResponseEntity<Map<String, Object>> getAdjustedRent(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paymentDate) {
        Long ownerId = currentUserService.getCurrentUserId();
        Lease lease = leaseService.getLeaseById(id, ownerId);

        LocalDate effectiveDate = paymentDate != null ? paymentDate : LocalDate.now();
        String countryCode = lease.getCountryCode() != null ? lease.getCountryCode() : "AR";
        Lease.AdjustmentIndex adjustmentIndex = lease.getAdjustmentIndex();

        Map<String, Object> result = new HashMap<>();
        result.put("leaseId", lease.getId());
        result.put("baseRent", lease.getMonthlyRent());
        result.put("adjustmentIndex", adjustmentIndex != null ? adjustmentIndex.name() : "NONE");
        result.put("leaseStartDate", lease.getStartDate());
        result.put("paymentDate", effectiveDate);

        if (adjustmentIndex == null || adjustmentIndex == Lease.AdjustmentIndex.NONE) {
            result.put("adjustedRent", lease.getMonthlyRent());
            result.put("adjustmentFactor", 1.0);
            result.put("message", "No adjustment index configured for this lease");
        } else {
            IndexValue.IndexType indexType = ADJUSTMENT_TO_INDEX_TYPE.get(adjustmentIndex);
            if (indexType != null) {
                BigDecimal adjustedRent = indexValueService.calculateAdjustedRent(
                    lease.getMonthlyRent(),
                    countryCode,
                    indexType,
                    lease.getStartDate(),
                    effectiveDate
                );
                BigDecimal adjustmentFactor = indexValueService.calculateAdjustmentFactor(
                    countryCode, indexType, lease.getStartDate(), effectiveDate
                );

                result.put("adjustedRent", adjustedRent);
                result.put("adjustmentFactor", adjustmentFactor);

                Optional<IndexValue> startValue = indexValueService.getClosestValue(countryCode, indexType, lease.getStartDate());
                Optional<IndexValue> currentValue = indexValueService.getClosestValue(countryCode, indexType, effectiveDate);

                if (startValue.isPresent()) {
                    result.put("indexAtLeaseStart", startValue.get().getValue());
                    result.put("indexDateAtLeaseStart", startValue.get().getValueDate());
                }
                if (currentValue.isPresent()) {
                    result.put("indexAtPaymentDate", currentValue.get().getValue());
                    result.put("indexDateAtPaymentDate", currentValue.get().getValueDate());
                }
            } else {
                result.put("adjustedRent", lease.getMonthlyRent());
                result.put("adjustmentFactor", 1.0);
                result.put("message", "Unknown adjustment index type");
            }
        }

        return ResponseEntity.ok(result);
    }
}
