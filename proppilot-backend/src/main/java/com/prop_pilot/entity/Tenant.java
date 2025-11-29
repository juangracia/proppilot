package com.prop_pilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "tenants")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Full name is required")
    private String fullName;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "National ID is required")
    private String nationalId;

    @Column(nullable = false)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Column(nullable = false)
    @NotBlank(message = "Phone is required")
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private User owner;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Lease> leases = new ArrayList<>();

    @Transient
    public Lease getActiveLease() {
        if (leases == null) return null;
        return leases.stream()
            .filter(Lease::isActive)
            .findFirst()
            .orElse(null);
    }

    @JsonProperty("property")
    public String getPropertyAddress() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getPropertyAddress() : null;
    }

    @JsonProperty("propertyId")
    public Long getPropertyId() {
        Lease activeLease = getActiveLease();
        return activeLease != null && activeLease.getPropertyUnit() != null
            ? activeLease.getPropertyUnit().getId() : null;
    }

    @JsonProperty("monthlyRent")
    public BigDecimal getMonthlyRent() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getMonthlyRent() : null;
    }

    @JsonProperty("leaseStart")
    public LocalDate getLeaseStart() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getStartDate() : null;
    }

    @JsonProperty("leaseEndDate")
    public LocalDate getLeaseEndDate() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getEndDate() : null;
    }

    @JsonProperty("activeLeaseId")
    public Long getActiveLeaseId() {
        Lease activeLease = getActiveLease();
        return activeLease != null ? activeLease.getId() : null;
    }
}
