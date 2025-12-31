package com.prop_pilot.service;

import com.prop_pilot.dto.excel.ExcelImportPreview;
import com.prop_pilot.dto.excel.ExcelImportResult;
import org.springframework.web.multipart.MultipartFile;

public interface ExcelImportExportService {

    /**
     * Export all user data to an Excel file with multiple sheets
     */
    byte[] exportAll(Long ownerId);

    /**
     * Generate an empty template Excel file with headers and help sheet
     */
    byte[] generateTemplate();

    /**
     * Preview an import without saving - validates and shows what will be imported
     */
    ExcelImportPreview previewImport(MultipartFile file, Long ownerId);

    /**
     * Execute the import after user confirms the preview
     */
    ExcelImportResult executeImport(ExcelImportPreview preview, Long ownerId);
}
