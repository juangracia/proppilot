package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id", nullable = false)
    @JsonIgnore
    private Tenant tenant;

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

    @Transient
    @JsonProperty("propertyUnitId")
    private Long inputPropertyUnitId;

    @Transient
    @JsonProperty("tenantId")
    private Long inputTenantId;

    @JsonProperty("propertyAddress")
    public String getPropertyAddress() {
        return propertyUnit != null ? propertyUnit.getAddress() : null;
    }

    @JsonProperty("propertyType")
    public String getPropertyType() {
        return propertyUnit != null ? propertyUnit.getType() : null;
    }

    @JsonProperty("tenantName")
    public String getTenantName() {
        return tenant != null ? tenant.getFullName() : null;
    }

    @JsonProperty("tenantEmail")
    public String getTenantEmail() {
        return tenant != null ? tenant.getEmail() : null;
    }

    @JsonProperty("tenantPhone")
    public String getTenantPhone() {
        return tenant != null ? tenant.getPhone() : null;
    }

    @JsonProperty("propertyUnitIdRef")
    public Long getPropertyUnitIdRef() {
        return propertyUnit != null ? propertyUnit.getId() : null;
    }

    @JsonProperty("tenantIdRef")
    public Long getTenantIdRef() {
        return tenant != null ? tenant.getId() : null;
    }

    public boolean isActive() {
        return status == LeaseStatus.ACTIVE &&
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
        FIXED,  // Sin ajuste (monto fijo)
        CUSTOM  // Ajuste personalizado
    }
}
