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
public class ExcelImportPreview {
    @Builder.Default
    private List<ExcelRowPreview<PropertyUnitExcelRow>> properties = new ArrayList<>();
    @Builder.Default
    private List<ExcelRowPreview<TenantExcelRow>> tenants = new ArrayList<>();
    @Builder.Default
    private List<ExcelRowPreview<LeaseExcelRow>> leases = new ArrayList<>();
    @Builder.Default
    private List<ExcelRowPreview<PaymentExcelRow>> payments = new ArrayList<>();

    private int totalRows;
    private int validRows;
    private int errorRows;
    private int newRecords;
    private int existingRecords;

    public void calculateStats() {
        totalRows = properties.size() + tenants.size() + leases.size() + payments.size();
        validRows = 0;
        errorRows = 0;
        newRecords = 0;
        existingRecords = 0;

        for (var row : properties) {
            if (row.isValid()) {
                validRows++;
                if (row.getAction() == ExcelRowPreview.ImportAction.CREATE) newRecords++;
                else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) existingRecords++;
            } else {
                errorRows++;
            }
        }
        for (var row : tenants) {
            if (row.isValid()) {
                validRows++;
                if (row.getAction() == ExcelRowPreview.ImportAction.CREATE) newRecords++;
                else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) existingRecords++;
            } else {
                errorRows++;
            }
        }
        for (var row : leases) {
            if (row.isValid()) {
                validRows++;
                if (row.getAction() == ExcelRowPreview.ImportAction.CREATE) newRecords++;
                else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) existingRecords++;
            } else {
                errorRows++;
            }
        }
        for (var row : payments) {
            if (row.isValid()) {
                validRows++;
                if (row.getAction() == ExcelRowPreview.ImportAction.CREATE) newRecords++;
                else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) existingRecords++;
            } else {
                errorRows++;
            }
        }
    }
}
