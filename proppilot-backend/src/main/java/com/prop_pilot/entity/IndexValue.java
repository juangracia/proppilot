package com.prop_pilot.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "index_values")
public class IndexValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "index_type", nullable = false, length = 20)
    private String indexType;

    @Column(name = "raw_response", columnDefinition = "text")
    private String rawResponse;

    @Column(name = "source", nullable = false, length = 100)
    private String source;

    @Column(name = "value", nullable = false, precision = 18, scale = 6)
    private BigDecimal value;

    @Column(name = "value_date", nullable = false)
    private LocalDate valueDate;
}
