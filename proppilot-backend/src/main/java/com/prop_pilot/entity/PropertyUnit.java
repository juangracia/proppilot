package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "property_units")
public class PropertyUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 255, message = "Address must be between 5 and 255 characters")
    private String address;

    @Column(nullable = false)
    @NotBlank(message = "Property type is required")
    @Size(min = 2, max = 50, message = "Property type must be between 2 and 50 characters")
    private String type;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Base rent amount is required")
    @DecimalMin(value = "0.01", message = "Base rent amount must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Base rent amount must have at most 8 digits and 2 decimal places")
    private BigDecimal baseRentAmount;

    @Column(name = "lease_start_date")
    private LocalDate leaseStartDate;

    @OneToMany(mappedBy = "propertyUnit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Lease> leases = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private User owner;

    @Transient
    public Lease getActiveLease() {
        if (leases == null) return null;
        return leases.stream()
            .filter(Lease::isActive)
            .findFirst()
            .orElse(null);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("currentTenantName")
    public String getCurrentTenantName() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getTenantName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("currentTenantId")
    public Long getCurrentTenantId() {
        Lease activeLease = getActiveLease();
        return activeLease != null && activeLease.getTenant() != null
            ? activeLease.getTenant().getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("activeLeaseId")
    public Long getActiveLeaseId() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getId() : null;
    }
}
