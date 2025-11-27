package com.mirent.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
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
    private String fullName;

    @Column(nullable = false, unique = true)
    private String nationalId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<PropertyUnit> propertyUnits = new ArrayList<>();

    @JsonProperty("property")
    public String getPropertyAddress() {
        if (propertyUnits == null || propertyUnits.isEmpty()) {
            return null;
        }
        return propertyUnits.get(0).getAddress();
    }

    @JsonProperty("monthlyRent")
    public BigDecimal getMonthlyRent() {
        if (propertyUnits == null || propertyUnits.isEmpty()) {
            return null;
        }
        return propertyUnits.get(0).getBaseRentAmount();
    }

    @JsonProperty("leaseStart")
    public LocalDate getLeaseStart() {
        if (propertyUnits == null || propertyUnits.isEmpty()) {
            return null;
        }
        return propertyUnits.get(0).getLeaseStartDate();
    }

    @JsonProperty("leaseEndDate")
    public LocalDate getLeaseEndDate() {
        if (propertyUnits == null || propertyUnits.isEmpty()) {
            return null;
        }
        LocalDate startDate = propertyUnits.get(0).getLeaseStartDate();
        return startDate != null ? startDate.plusYears(1) : null;
    }
}
