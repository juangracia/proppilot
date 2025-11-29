package com.prop_pilot.controller;

import com.prop_pilot.entity.Payment;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "API for managing rental payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;

    public PaymentController(PaymentService paymentService, CurrentUserService currentUserService) {
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Create a new payment", description = "Registers a new payment for a lease contract")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Payment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid payment data or missing lease")
    })
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody Payment payment) {
        Long ownerId = currentUserService.getCurrentUserId();
        Payment createdPayment = paymentService.createPayment(payment, ownerId);
        return new ResponseEntity<>(createdPayment, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID", description = "Retrieves a specific payment by its ID")
    @ApiResponse(responseCode = "200", description = "Payment retrieved successfully")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        Payment payment = paymentService.getPaymentById(id, ownerId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping
    @Operation(summary = "Get all payments", description = "Retrieves a list of all payments for the current landlord")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> payments = paymentService.getAllPayments(ownerId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/lease/{leaseId}")
    @Operation(summary = "Get payments by lease", description = "Retrieves all payments for a specific lease contract")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved payments for lease")
    public ResponseEntity<List<Payment>> getPaymentsByLease(@PathVariable Long leaseId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> payments = paymentService.getPaymentsByLease(leaseId, ownerId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/property-unit/{propertyUnitId}")
    @Operation(summary = "Get payments by property unit", description = "Retrieves all payments for a specific property unit across all leases")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved payments for property unit")
    public ResponseEntity<List<Payment>> getPaymentsByPropertyUnit(@PathVariable Long propertyUnitId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> payments = paymentService.getPaymentsByPropertyUnit(propertyUnitId, ownerId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/tenant/{tenantId}")
    @Operation(summary = "Get payments by tenant", description = "Retrieves all payments made by a specific tenant")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved payments for tenant")
    public ResponseEntity<List<Payment>> getPaymentsByTenant(@PathVariable Long tenantId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> payments = paymentService.getPaymentsByTenant(tenantId, ownerId);
        return ResponseEntity.ok(payments);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update payment", description = "Updates an existing payment")
    @ApiResponse(responseCode = "200", description = "Payment updated successfully")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        Long ownerId = currentUserService.getCurrentUserId();
        Payment updatedPayment = paymentService.updatePayment(id, payment, ownerId);
        return ResponseEntity.ok(updatedPayment);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete payment", description = "Deletes a payment by ID")
    @ApiResponse(responseCode = "204", description = "Payment deleted successfully")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        Long ownerId = currentUserService.getCurrentUserId();
        paymentService.deletePayment(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/lease/{leaseId}/outstanding")
    @Operation(summary = "Get outstanding payments", description = "Retrieves all outstanding (pending) payments for a lease")
    @ApiResponse(responseCode = "200", description = "Outstanding payments retrieved successfully")
    public ResponseEntity<List<Payment>> getOutstandingPayments(@PathVariable Long leaseId) {
        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> outstandingPayments = paymentService.getOutstandingPaymentsByLease(leaseId, ownerId);
        return ResponseEntity.ok(outstandingPayments);
    }

    @GetMapping("/lease/{leaseId}/outstanding-amount")
    @Operation(summary = "Calculate outstanding amount", description = "Calculates the total outstanding rent amount for a lease")
    @ApiResponse(responseCode = "200", description = "Outstanding amount calculated successfully")
    public ResponseEntity<BigDecimal> calculateOutstandingAmount(
            @Parameter(description = "Lease ID") @PathVariable Long leaseId,
            @Parameter(description = "As of date for calculation (defaults to current date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {

        LocalDate calculationDate = asOfDate != null ? asOfDate : LocalDate.now();
        Long ownerId = currentUserService.getCurrentUserId();
        BigDecimal outstandingAmount = paymentService.calculateOutstandingAmount(leaseId, calculationDate, ownerId);
        return ResponseEntity.ok(outstandingAmount);
    }

    @GetMapping("/lease/{leaseId}/total-paid")
    @Operation(summary = "Get total paid amount by payment type", description = "Calculates total amount paid for a specific payment type on a lease")
    @ApiResponse(responseCode = "200", description = "Total paid amount calculated successfully")
    public ResponseEntity<BigDecimal> getTotalPaidAmount(
            @Parameter(description = "Lease ID") @PathVariable Long leaseId,
            @Parameter(description = "Payment type") @RequestParam Payment.PaymentType paymentType) {

        Long ownerId = currentUserService.getCurrentUserId();
        BigDecimal totalPaid = paymentService.getTotalPaidAmountByLease(leaseId, paymentType, ownerId);
        return ResponseEntity.ok(totalPaid);
    }

    @GetMapping("/lease/{leaseId}/history")
    @Operation(summary = "Get payment history", description = "Retrieves payment history for a lease within a date range")
    @ApiResponse(responseCode = "200", description = "Payment history retrieved successfully")
    public ResponseEntity<List<Payment>> getPaymentHistory(
            @Parameter(description = "Lease ID") @PathVariable Long leaseId,
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Long ownerId = currentUserService.getCurrentUserId();
        List<Payment> paymentHistory = paymentService.getPaymentHistory(leaseId, startDate, endDate, ownerId);
        return ResponseEntity.ok(paymentHistory);
    }
}
