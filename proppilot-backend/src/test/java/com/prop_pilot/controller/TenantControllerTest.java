package com.prop_pilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prop_pilot.entity.Tenant;
import com.prop_pilot.exception.GlobalExceptionHandler;
import com.prop_pilot.service.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TenantController.class)
@Import(GlobalExceptionHandler.class)
class TenantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TenantService tenantService;

    @Autowired
    private ObjectMapper objectMapper;

    private Tenant testTenant;

    @BeforeEach
    void setUp() {
        testTenant = new Tenant();
        testTenant.setId(1L);
        testTenant.setFullName("John Doe");
        testTenant.setNationalId("12345678");
        testTenant.setEmail("john.doe@example.com");
        testTenant.setPhone("+1 123-456-7890");
    }

    @Test
    void testCreateTenant_Success() throws Exception {
        // Given
        Tenant newTenant = new Tenant();
        newTenant.setFullName("Jane Smith");
        newTenant.setNationalId("87654321");
        newTenant.setEmail("jane.smith@example.com");
        newTenant.setPhone("+1 987-654-3210");

        when(tenantService.createTenant(any(Tenant.class))).thenReturn(testTenant);

        // When & Then
        mockMvc.perform(post("/api/tenants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newTenant)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testTenant.getId()))
                .andExpect(jsonPath("$.fullName").value(testTenant.getFullName()))
                .andExpect(jsonPath("$.email").value(testTenant.getEmail()));

        verify(tenantService, times(1)).createTenant(any(Tenant.class));
    }

    @Test
    void testCreateTenant_DuplicateNationalId() throws Exception {
        // Given
        Tenant newTenant = new Tenant();
        newTenant.setFullName("Jane Smith");
        newTenant.setNationalId("12345678");
        newTenant.setEmail("jane.smith@example.com");

        when(tenantService.createTenant(any(Tenant.class)))
                .thenThrow(new IllegalArgumentException("A tenant with this national ID already exists"));

        // When & Then
        mockMvc.perform(post("/api/tenants")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newTenant)))
                .andExpect(status().isBadRequest());

        verify(tenantService, times(1)).createTenant(any(Tenant.class));
    }

    @Test
    void testGetTenantById_Success() throws Exception {
        // Given
        Long tenantId = 1L;
        when(tenantService.getTenantById(tenantId)).thenReturn(Optional.of(testTenant));

        // When & Then
        mockMvc.perform(get("/api/tenants/{id}", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testTenant.getId()))
                .andExpect(jsonPath("$.fullName").value(testTenant.getFullName()))
                .andExpect(jsonPath("$.email").value(testTenant.getEmail()));

        verify(tenantService, times(1)).getTenantById(tenantId);
    }

    @Test
    void testGetTenantById_NotFound() throws Exception {
        // Given
        Long tenantId = 999L;
        when(tenantService.getTenantById(tenantId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/tenants/{id}", tenantId))
                .andExpect(status().isNotFound());

        verify(tenantService, times(1)).getTenantById(tenantId);
    }

    @Test
    void testGetAllTenants_Success() throws Exception {
        // Given
        Tenant tenant2 = new Tenant();
        tenant2.setId(2L);
        tenant2.setFullName("Jane Smith");
        tenant2.setNationalId("87654321");
        tenant2.setEmail("jane.smith@example.com");

        List<Tenant> tenants = Arrays.asList(testTenant, tenant2);
        when(tenantService.getAllTenants()).thenReturn(tenants);

        // When & Then
        mockMvc.perform(get("/api/tenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(testTenant.getId()))
                .andExpect(jsonPath("$[1].id").value(tenant2.getId()));

        verify(tenantService, times(1)).getAllTenants();
    }

    @Test
    void testUpdateTenant_Success() throws Exception {
        // Given
        Long tenantId = 1L;
        Tenant updateData = new Tenant();
        updateData.setFullName("John Updated");
        updateData.setNationalId("12345678");
        updateData.setEmail("john.updated@example.com");
        updateData.setPhone("+1 111-222-3333");

        Tenant updatedTenant = new Tenant();
        updatedTenant.setId(tenantId);
        updatedTenant.setFullName("John Updated");
        updatedTenant.setEmail("john.updated@example.com");

        when(tenantService.updateTenant(eq(tenantId), any(Tenant.class))).thenReturn(updatedTenant);

        // When & Then
        mockMvc.perform(put("/api/tenants/{id}", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedTenant.getId()))
                .andExpect(jsonPath("$.fullName").value(updatedTenant.getFullName()));

        verify(tenantService, times(1)).updateTenant(eq(tenantId), any(Tenant.class));
    }

    @Test
    void testUpdateTenant_NotFound() throws Exception {
        // Given
        Long tenantId = 999L;
        Tenant updateData = new Tenant();
        updateData.setFullName("Updated Name");

        when(tenantService.updateTenant(eq(tenantId), any(Tenant.class)))
                .thenThrow(new RuntimeException("Tenant not found"));

        // When & Then
        mockMvc.perform(put("/api/tenants/{id}", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isNotFound());

        verify(tenantService, times(1)).updateTenant(eq(tenantId), any(Tenant.class));
    }

    @Test
    void testDeleteTenant_Success() throws Exception {
        // Given
        Long tenantId = 1L;
        doNothing().when(tenantService).deleteTenant(tenantId);

        // When & Then
        mockMvc.perform(delete("/api/tenants/{id}", tenantId))
                .andExpect(status().isNoContent());

        verify(tenantService, times(1)).deleteTenant(tenantId);
    }

    @Test
    void testDeleteTenant_NotFound() throws Exception {
        // Given
        Long tenantId = 999L;
        doThrow(new RuntimeException("Tenant not found"))
                .when(tenantService).deleteTenant(tenantId);

        // When & Then
        mockMvc.perform(delete("/api/tenants/{id}", tenantId))
                .andExpect(status().isNotFound());

        verify(tenantService, times(1)).deleteTenant(tenantId);
    }

    @Test
    void testGetTenantByNationalId_Success() throws Exception {
        // Given
        String nationalId = "12345678";
        when(tenantService.getTenantByNationalId(nationalId)).thenReturn(Optional.of(testTenant));

        // When & Then
        mockMvc.perform(get("/api/tenants/search/national-id/{nationalId}", nationalId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testTenant.getId()))
                .andExpect(jsonPath("$.nationalId").value(testTenant.getNationalId()));

        verify(tenantService, times(1)).getTenantByNationalId(nationalId);
    }

    @Test
    void testGetTenantByNationalId_NotFound() throws Exception {
        // Given
        String nationalId = "99999999";
        when(tenantService.getTenantByNationalId(nationalId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/tenants/search/national-id/{nationalId}", nationalId))
                .andExpect(status().isNotFound());

        verify(tenantService, times(1)).getTenantByNationalId(nationalId);
    }

    @Test
    void testGetTenantByEmail_Success() throws Exception {
        // Given
        String email = "john.doe@example.com";
        when(tenantService.getTenantByEmail(email)).thenReturn(Optional.of(testTenant));

        // When & Then
        mockMvc.perform(get("/api/tenants/search/email/{email}", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testTenant.getId()))
                .andExpect(jsonPath("$.email").value(testTenant.getEmail()));

        verify(tenantService, times(1)).getTenantByEmail(email);
    }

    @Test
    void testGetTenantByEmail_NotFound() throws Exception {
        // Given
        String email = "nonexistent@example.com";
        when(tenantService.getTenantByEmail(email)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/tenants/search/email/{email}", email))
                .andExpect(status().isNotFound());

        verify(tenantService, times(1)).getTenantByEmail(email);
    }
}

