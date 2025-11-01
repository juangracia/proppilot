package com.prop_pilot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(nullable = false)
    @NotNull(message = "Base rent amount is required")
    @DecimalMin(value = "0.01", message = "Base rent amount must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Base rent amount must have at most 8 digits and 2 decimal places")
    private BigDecimal baseRentAmount;

    @Column(nullable = false)
    @NotNull(message = "Lease start date is required")
    @PastOrPresent(message = "Lease start date cannot be in the future")
    private LocalDate leaseStartDate;

    @OneToMany(mappedBy = "propertyUnit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Payment> payments = new ArrayList<>();
}
