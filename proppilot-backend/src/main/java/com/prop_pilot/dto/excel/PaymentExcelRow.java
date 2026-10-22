package com.prop_pilot.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentExcelRow {
    private String propertyAddress;
    private String tenantNationalId;
    private LocalDate leaseStartDate;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentType;
    private String status;
    private String description;
}
