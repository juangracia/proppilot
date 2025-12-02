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

    // Legacy address field - kept for backward compatibility
    @Column(nullable = false)
    @Size(max = 255)
    private String address;

    // Structured address fields
    @Column(name = "street")
    @Size(max = 150, message = "Street name cannot exceed 150 characters")
    private String street;

    @Column(name = "street_number")
    @Size(max = 20, message = "Street number cannot exceed 20 characters")
    private String streetNumber;

    @Column(name = "floor")
    @Size(max = 10, message = "Floor cannot exceed 10 characters")
    private String floor;

    @Column(name = "apartment")
    @Size(max = 20, message = "Apartment cannot exceed 20 characters")
    private String apartment;

    @Column(name = "city")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Column(name = "province")
    @Size(max = 100, message = "Province cannot exceed 100 characters")
    private String province;

    @Column(name = "postal_code")
    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

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
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    private User owner;

    @Transient
    @JsonIgnore
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
        return activeLease != null ? activeLease.getTenantIdRef() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("activeLeaseId")
    public Long getActiveLeaseId() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getId() : null;
    }

    /**
     * Builds the full address from structured fields.
     * If structured fields are not populated, returns the legacy address.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("fullAddress")
    public String getFullAddress() {
        if (street == null || street.isBlank()) {
            return address; // Return legacy address if no structured data
        }

        StringBuilder sb = new StringBuilder();
        sb.append(street);
        if (streetNumber != null && !streetNumber.isBlank()) {
            sb.append(" ").append(streetNumber);
        }
        if (floor != null && !floor.isBlank()) {
            sb.append(", Piso ").append(floor);
        }
        if (apartment != null && !apartment.isBlank()) {
            sb.append(", Depto ").append(apartment);
        }
        if (city != null && !city.isBlank()) {
            sb.append(", ").append(city);
        }
        if (province != null && !province.isBlank()) {
            sb.append(", ").append(province);
        }
        if (postalCode != null && !postalCode.isBlank()) {
            sb.append(" (").append(postalCode).append(")");
        }
        return sb.toString();
    }

    /**
     * Updates the legacy address field from structured fields before persisting.
     */
    @PrePersist
    @PreUpdate
    public void updateAddressFromStructuredFields() {
        if (street != null && !street.isBlank()) {
            this.address = getFullAddress();
        }
    }
}
