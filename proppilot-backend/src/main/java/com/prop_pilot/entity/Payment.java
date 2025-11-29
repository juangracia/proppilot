package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
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
    @JoinColumn(name = "property_unit_id", nullable = false)
    @JsonBackReference
    private PropertyUnit propertyUnit;

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

    // Legacy fields for compatibility
    @Column
    private String monthYear;

    @Column
    private String appliedIndex;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("propertyUnitId")
    private Long inputPropertyUnitId;

    // Computed JSON properties for API responses
    @com.fasterxml.jackson.annotation.JsonProperty("propertyAddress")
    public String getPropertyAddress() {
        return propertyUnit != null ? propertyUnit.getAddress() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("tenantName")
    public String getTenantName() {
        if (propertyUnit != null && propertyUnit.getTenant() != null) {
            return propertyUnit.getTenant().getFullName();
        }
        return null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("propertyUnitIdRef")
    public Long getPropertyUnitIdRef() {
        return propertyUnit != null ? propertyUnit.getId() : null;
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
