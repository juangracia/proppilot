package com.prop_pilot.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcelImportResult {
    private int propertiesCreated;
    private int tenantsCreated;
    private int leasesCreated;
    private int paymentsCreated;
    private int skipped;
    private int errors;
    @Builder.Default
    private List<String> errorMessages = new ArrayList<>();
    private boolean success;

    public int getTotalCreated() {
        return propertiesCreated + tenantsCreated + leasesCreated + paymentsCreated;
    }
}
