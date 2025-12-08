package com.prop_pilot.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "index_values",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_index_country_date",
           columnNames = {"index_type", "country_code", "value_date"}
       ),
       indexes = {
           @Index(name = "idx_index_values_type", columnList = "index_type"),
           @Index(name = "idx_index_values_date", columnList = "value_date DESC"),
           @Index(name = "idx_index_values_country", columnList = "country_code")
       })
public class IndexValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "index_type", nullable = false, length = 20)
    private IndexType indexType;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "value_date", nullable = false)
    private LocalDate valueDate;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal value;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum IndexType {
        ICL,            // Indice para Contratos de Locacion (Argentina)
        IPC,            // Indice de Precios al Consumidor
        DOLAR_BLUE,     // Dolar Blue (informal market rate)
        DOLAR_OFICIAL,  // Dolar Oficial (official exchange rate)
        DOLAR_MEP,      // Dolar MEP (stock market exchange rate)
        NONE            // No index (fixed rent)
    }
}
