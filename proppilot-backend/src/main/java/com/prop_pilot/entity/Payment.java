package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    @JsonBackReference("lease-payments")
    private Lease lease;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Payment amount must have at most 8 digits and 2 decimal places")
    private BigDecimal amount;

    @Column(nullable = false)
    @NotNull(message = "Payment date is required")
    @PastOrPresent(message = "Payment date cannot be in the future")
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType = PaymentType.RENT;

    @Column(length = 500)
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PAID;

    @Transient
    @JsonProperty("leaseId")
    private Long inputLeaseId;

    @JsonProperty("propertyAddress")
    public String getPropertyAddress() {
        if (lease != null && lease.getPropertyUnit() != null) {
            return lease.getPropertyUnit().getAddress();
        }
        return null;
    }

    @JsonProperty("tenantName")
    public String getTenantName() {
        if (lease != null && lease.getTenant() != null) {
            return lease.getTenant().getFullName();
        }
        return null;
    }

    @JsonProperty("tenantId")
    public Long getTenantIdRef() {
        if (lease != null && lease.getTenant() != null) {
            return lease.getTenant().getId();
        }
        return null;
    }

    @JsonProperty("propertyUnitId")
    public Long getPropertyUnitIdRef() {
        if (lease != null && lease.getPropertyUnit() != null) {
            return lease.getPropertyUnit().getId();
        }
        return null;
    }

    @JsonProperty("leaseIdRef")
    public Long getLeaseIdRef() {
        return lease != null ? lease.getId() : null;
    }

    @JsonProperty("leaseStartDate")
    public LocalDate getLeaseStartDate() {
        return lease != null ? lease.getStartDate() : null;
    }

    @JsonProperty("leaseEndDate")
    public LocalDate getLeaseEndDate() {
        return lease != null ? lease.getEndDate() : null;
    }

    @JsonProperty("monthlyRent")
    public BigDecimal getMonthlyRent() {
        return lease != null ? lease.getMonthlyRent() : null;
    }

    public enum PaymentType {
        RENT,
        DEPOSIT,
        MAINTENANCE,
        UTILITY,
        OTHER
    }

    public enum PaymentStatus {
        PAID,
        PENDING
    }
}
