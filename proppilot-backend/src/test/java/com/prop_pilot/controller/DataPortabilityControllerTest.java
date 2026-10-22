package com.prop_pilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prop_pilot.dto.excel.ExcelImportPreview;
import com.prop_pilot.dto.excel.ExcelImportResult;
import com.prop_pilot.service.CurrentUserService;
import com.prop_pilot.service.ExcelImportExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class DataPortabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExcelImportExportService excelService;

    @MockBean
    private CurrentUserService currentUserService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void exportAll_ShouldReturnExcelFile() throws Exception {
        byte[] excelBytes = new byte[]{0x50, 0x4B, 0x03, 0x04}; // Minimal xlsx header
        when(excelService.exportAll(1L)).thenReturn(excelBytes);

        mockMvc.perform(get("/api/data/export"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"mis_datos.xlsx\""));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void downloadTemplate_ShouldReturnTemplateFile() throws Exception {
        byte[] templateBytes = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(excelService.generateTemplate()).thenReturn(templateBytes);

        mockMvc.perform(get("/api/data/template"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .andExpect(header().string("Content-Disposition", "form-data; name=\"attachment\"; filename=\"plantilla_importacion.xlsx\""));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void previewImport_ShouldReturnPreview() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            new byte[]{0x50, 0x4B, 0x03, 0x04}
        );

        ExcelImportPreview preview = new ExcelImportPreview();
        preview.setProperties(Collections.emptyList());
        preview.setTenants(Collections.emptyList());
        preview.setLeases(Collections.emptyList());
        preview.setPayments(Collections.emptyList());
        preview.setTotalRows(0);
        preview.setValidRows(0);

        when(excelService.previewImport(any(), eq(1L))).thenReturn(preview);

        mockMvc.perform(multipart("/api/data/import/preview").file(file))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRows").value(0));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void executeImport_ShouldReturnResult() throws Exception {
        ExcelImportPreview preview = new ExcelImportPreview();
        preview.setProperties(Collections.emptyList());
        preview.setTenants(Collections.emptyList());
        preview.setLeases(Collections.emptyList());
        preview.setPayments(Collections.emptyList());

        ExcelImportResult result = ExcelImportResult.builder()
            .propertiesCreated(5)
            .tenantsCreated(3)
            .leasesCreated(2)
            .paymentsCreated(10)
            .success(true)
            .build();

        when(excelService.executeImport(any(), eq(1L))).thenReturn(result);

        mockMvc.perform(post("/api/data/import/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preview)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.propertiesCreated").value(5))
            .andExpect(jsonPath("$.tenantsCreated").value(3))
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void exportAll_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/data/export"))
            .andExpect(status().isUnauthorized());
    }
}
