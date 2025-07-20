package com.prop_pilot.controller;

import com.prop_pilot.entity.Payment;
import com.prop_pilot.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "API for managing rental payments and calculations")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    @Operation(summary = "Create a new payment", description = "Registers a new payment for a property unit")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Payment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid payment data")
    })
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody Payment payment) {
        Payment createdPayment = paymentService.createPayment(payment);
        return new ResponseEntity<>(createdPayment, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID", description = "Retrieves a specific payment by its ID")
    @ApiResponse(responseCode = "200", description = "Payment retrieved successfully")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        Payment payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(payment);
    }

    @GetMapping
    @Operation(summary = "Get all payments", description = "Retrieves a list of all payments in the system")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/property-unit/{propertyUnitId}")
    @Operation(summary = "Get payments by property unit", description = "Retrieves all payments for a specific property unit")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved payments for property unit")
    public ResponseEntity<List<Payment>> getPaymentsByPropertyUnit(@PathVariable Long propertyUnitId) {
        List<Payment> payments = paymentService.getPaymentsByPropertyUnit(propertyUnitId);
        return ResponseEntity.ok(payments);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update payment", description = "Updates an existing payment")
    @ApiResponse(responseCode = "200", description = "Payment updated successfully")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        Payment updatedPayment = paymentService.updatePayment(id, payment);
        return ResponseEntity.ok(updatedPayment);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete payment", description = "Deletes a payment by ID")
    @ApiResponse(responseCode = "204", description = "Payment deleted successfully")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    // Advanced rent calculation endpoints

    @GetMapping("/property-unit/{propertyUnitId}/adjusted-rent")
    @Operation(summary = "Calculate adjusted rent", description = "Calculates the adjusted rent for a property unit based on lease terms and time elapsed")
    @ApiResponse(responseCode = "200", description = "Adjusted rent calculated successfully")
    public ResponseEntity<BigDecimal> calculateAdjustedRent(
            @Parameter(description = "Property unit ID") @PathVariable Long propertyUnitId,
            @Parameter(description = "Effective date for calculation (defaults to current date)") 
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveDate) {
        
        LocalDate calculationDate = effectiveDate != null ? effectiveDate : LocalDate.now();
        BigDecimal adjustedRent = paymentService.calculateAdjustedRent(propertyUnitId, calculationDate);
        return ResponseEntity.ok(adjustedRent);
    }

    @GetMapping("/property-unit/{propertyUnitId}/outstanding")
    @Operation(summary = "Get outstanding payments", description = "Retrieves all outstanding (pending) payments for a property unit")
    @ApiResponse(responseCode = "200", description = "Outstanding payments retrieved successfully")
    public ResponseEntity<List<Payment>> getOutstandingPayments(@PathVariable Long propertyUnitId) {
        List<Payment> outstandingPayments = paymentService.getOutstandingPayments(propertyUnitId);
        return ResponseEntity.ok(outstandingPayments);
    }

    @GetMapping("/property-unit/{propertyUnitId}/outstanding-amount")
    @Operation(summary = "Calculate outstanding amount", description = "Calculates the total outstanding rent amount for a property unit")
    @ApiResponse(responseCode = "200", description = "Outstanding amount calculated successfully")
    public ResponseEntity<BigDecimal> calculateOutstandingAmount(
            @Parameter(description = "Property unit ID") @PathVariable Long propertyUnitId,
            @Parameter(description = "As of date for calculation (defaults to current date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        
        LocalDate calculationDate = asOfDate != null ? asOfDate : LocalDate.now();
        BigDecimal outstandingAmount = paymentService.calculateOutstandingAmount(propertyUnitId, calculationDate);
        return ResponseEntity.ok(outstandingAmount);
    }

    @GetMapping("/property-unit/{propertyUnitId}/total-paid")
    @Operation(summary = "Get total paid amount by payment type", description = "Calculates total amount paid for a specific payment type")
    @ApiResponse(responseCode = "200", description = "Total paid amount calculated successfully")
    public ResponseEntity<BigDecimal> getTotalPaidAmount(
            @Parameter(description = "Property unit ID") @PathVariable Long propertyUnitId,
            @Parameter(description = "Payment type") @RequestParam Payment.PaymentType paymentType) {
        
        BigDecimal totalPaid = paymentService.getTotalPaidAmount(propertyUnitId, paymentType);
        return ResponseEntity.ok(totalPaid);
    }

    @GetMapping("/property-unit/{propertyUnitId}/history")
    @Operation(summary = "Get payment history", description = "Retrieves payment history for a property unit within a date range")
    @ApiResponse(responseCode = "200", description = "Payment history retrieved successfully")
    public ResponseEntity<List<Payment>> getPaymentHistory(
            @Parameter(description = "Property unit ID") @PathVariable Long propertyUnitId,
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<Payment> paymentHistory = paymentService.getPaymentHistory(propertyUnitId, startDate, endDate);
        return ResponseEntity.ok(paymentHistory);
    }
}
