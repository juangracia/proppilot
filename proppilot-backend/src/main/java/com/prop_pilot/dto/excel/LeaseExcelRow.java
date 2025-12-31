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
public class LeaseExcelRow {
    private String propertyAddress;
    private String tenantNationalIds; // Comma-separated for multiple tenants
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyRent;
    private String adjustmentIndex;
    private Integer adjustmentFrequencyMonths;
    private String status;
}
