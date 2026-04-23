package com.prop_pilot.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "index_values")
public class IndexValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "index_type", nullable = false)
    private String indexType;

    @Column(name = "country_code", nullable = false)
    private String countryCode;

    @Column(name = "value_date", nullable = false)
    private LocalDate valueDate;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal value;

    @Column
    private String source;

    public Long getId() {
        return id;
    }

    public String getIndexType() {
        return indexType;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public LocalDate getValueDate() {
        return valueDate;
    }

    public BigDecimal getValue() {
        return value;
    }

    public String getSource() {
        return source;
    }
}
