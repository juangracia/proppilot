package com.prop_pilot.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantExcelRow {
    private String fullName;
    private String nationalId;
    private String email;
    private String phone;
}
