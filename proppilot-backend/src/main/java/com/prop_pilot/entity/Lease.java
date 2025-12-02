package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@EqualsAndHashCode(exclude = {"tenants", "payments", "propertyUnit", "owner"})
@ToString(exclude = {"tenants", "payments", "propertyUnit", "owner"})
@Entity
@Table(name = "leases")
public class Lease {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_unit_id", nullable = false)
    @JsonIgnore
    private PropertyUnit propertyUnit;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "lease_tenants",
        joinColumns = @JoinColumn(name = "lease_id"),
        inverseJoinColumns = @JoinColumn(name = "tenant_id")
    )
    @JsonIgnore
    private Set<Tenant> tenants = new HashSet<>();

    @Column(nullable = false)
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @Column(nullable = false)
    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Monthly rent is required")
    @DecimalMin(value = "0.01", message = "Monthly rent must be greater than 0")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal monthlyRent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaseStatus status = LeaseStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdjustmentIndex adjustmentIndex = AdjustmentIndex.ICL;

    @Column
    private Integer adjustmentFrequencyMonths = 12;

    @OneToMany(mappedBy = "lease", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("lease-payments")
    private List<Payment> payments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    private User owner;

    // Soft delete fields - nullable to support migration from existing data
    @Column(columnDefinition = "boolean default false")
    private boolean deleted = false;

    @Column
    private LocalDateTime deletedAt;

    @Transient
    @JsonProperty("propertyUnitId")
    private Long inputPropertyUnitId;

    @Transient
    @JsonProperty("tenantIds")
    private List<Long> inputTenantIds;

    @JsonProperty("propertyAddress")
    public String getPropertyAddress() {
        return propertyUnit != null ? propertyUnit.getAddress() : null;
    }

    @JsonProperty("propertyType")
    public String getPropertyType() {
        return propertyUnit != null ? propertyUnit.getType() : null;
    }

    @JsonProperty("tenantNames")
    public List<String> getTenantNames() {
        if (tenants == null || tenants.isEmpty()) return List.of();
        return tenants.stream().map(Tenant::getFullName).collect(Collectors.toList());
    }

    @JsonProperty("tenantEmails")
    public List<String> getTenantEmails() {
        if (tenants == null || tenants.isEmpty()) return List.of();
        return tenants.stream().map(Tenant::getEmail).collect(Collectors.toList());
    }

    @JsonProperty("tenantPhones")
    public List<String> getTenantPhones() {
        if (tenants == null || tenants.isEmpty()) return List.of();
        return tenants.stream().map(Tenant::getPhone).collect(Collectors.toList());
    }

    // For backward compatibility - returns first tenant name
    @JsonProperty("tenantName")
    public String getTenantName() {
        if (tenants == null || tenants.isEmpty()) return null;
        return tenants.iterator().next().getFullName();
    }

    @JsonProperty("propertyUnitIdRef")
    public Long getPropertyUnitIdRef() {
        return propertyUnit != null ? propertyUnit.getId() : null;
    }

    @JsonProperty("tenantIdRefs")
    public List<Long> getTenantIdRefs() {
        if (tenants == null || tenants.isEmpty()) return List.of();
        return tenants.stream().map(Tenant::getId).collect(Collectors.toList());
    }

    // For backward compatibility - returns first tenant ID
    @JsonProperty("tenantIdRef")
    public Long getTenantIdRef() {
        if (tenants == null || tenants.isEmpty()) return null;
        return tenants.iterator().next().getId();
    }

    public boolean isActive() {
        return status == LeaseStatus.ACTIVE &&
               !deleted &&
               !LocalDate.now().isBefore(startDate) &&
               !LocalDate.now().isAfter(endDate);
    }

    public enum LeaseStatus {
        ACTIVE,
        EXPIRED,
        TERMINATED
    }

    public enum AdjustmentIndex {
        ICL,    // Índice para Contratos de Locación (Argentina)
        IPC,    // Índice de Precios al Consumidor
        NONE    // Sin ajuste (monto fijo)
    }
}
