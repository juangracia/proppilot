package com.prop_pilot.controller;

import com.prop_pilot.dto.excel.ExcelImportPreview;
import com.prop_pilot.dto.excel.ExcelImportResult;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.ExcelImportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/data")
@Tag(name = "Data Portability", description = "Import and export data in Excel format")
public class DataPortabilityController {

    private final ExcelImportExportService excelService;
    private final CurrentUserService currentUserService;

    public DataPortabilityController(ExcelImportExportService excelService, CurrentUserService currentUserService) {
        this.excelService = excelService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/export")
    @Operation(summary = "Export all data", description = "Export all user data to an Excel file with multiple sheets")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Excel file generated successfully"),
        @ApiResponse(responseCode = "500", description = "Error generating file")
    })
    public ResponseEntity<byte[]> exportAll() {
        Long ownerId = currentUserService.getCurrentUserId();
        byte[] excelBytes = excelService.exportAll(ownerId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "mis_datos.xlsx");
        headers.setContentLength(excelBytes.length);

        return ResponseEntity.ok()
            .headers(headers)
            .body(excelBytes);
    }

    @GetMapping("/template")
    @Operation(summary = "Download empty template", description = "Download an empty Excel template with headers and help sheet")
    @ApiResponse(responseCode = "200", description = "Template generated successfully")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] templateBytes = excelService.generateTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "plantilla_importacion.xlsx");
        headers.setContentLength(templateBytes.length);

        return ResponseEntity.ok()
            .headers(headers)
            .body(templateBytes);
    }

    @PostMapping("/import/preview")
    @Operation(summary = "Preview import", description = "Parse Excel file and return preview of what will be imported")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Preview generated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid file format")
    })
    public ResponseEntity<ExcelImportPreview> previewImport(@RequestParam("file") MultipartFile file) {
        Long ownerId = currentUserService.getCurrentUserId();
        ExcelImportPreview preview = excelService.previewImport(file, ownerId);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/import/execute")
    @Operation(summary = "Execute import", description = "Execute the import after user confirms preview")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Import completed"),
        @ApiResponse(responseCode = "400", description = "Import failed")
    })
    public ResponseEntity<ExcelImportResult> executeImport(@RequestBody ExcelImportPreview preview) {
        Long ownerId = currentUserService.getCurrentUserId();
        ExcelImportResult result = excelService.executeImport(preview, ownerId);
        return ResponseEntity.ok(result);
    }
}
