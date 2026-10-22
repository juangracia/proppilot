package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    // Note: @NotNull removed - validation is handled in PaymentServiceImpl.createPayment()
    // to support receiving just leaseId (inputLeaseId) from frontend
    @JsonBackReference("lease-payments")
    private Lease lease;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User owner;

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

    // Index tracking - records the index value at payment creation time
    @Column(name = "index_type", length = 20)
    private String indexType;

    @Column(name = "index_value_at_payment", precision = 18, scale = 6)
    private BigDecimal indexValueAtPayment;

    @Column(name = "index_date")
    private LocalDate indexDate;

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

    @JsonProperty("tenantNames")
    public List<String> getTenantNames() {
        if (lease != null && lease.getTenants() != null && !lease.getTenants().isEmpty()) {
            return lease.getTenants().stream().map(Tenant::getFullName).collect(Collectors.toList());
        }
        return List.of();
    }

    // For backward compatibility - returns first tenant name
    @JsonProperty("tenantName")
    public String getTenantName() {
        if (lease != null && lease.getTenants() != null && !lease.getTenants().isEmpty()) {
            return lease.getTenants().iterator().next().getFullName();
        }
        return null;
    }

    @JsonProperty("tenantIds")
    public List<Long> getTenantIdRefs() {
        if (lease != null && lease.getTenants() != null && !lease.getTenants().isEmpty()) {
            return lease.getTenants().stream().map(Tenant::getId).collect(Collectors.toList());
        }
        return List.of();
    }

    // For backward compatibility - returns first tenant ID
    @JsonProperty("tenantId")
    public Long getTenantIdRef() {
        if (lease != null && lease.getTenants() != null && !lease.getTenants().isEmpty()) {
            return lease.getTenants().iterator().next().getId();
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
