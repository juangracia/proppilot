package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Tenant;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantServiceImplTest {

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private TenantServiceImpl tenantService;

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
    void testCreateTenant_Success() {
        // Given
        Tenant newTenant = new Tenant();
        newTenant.setFullName("Jane Smith");
        newTenant.setNationalId("87654321");
        newTenant.setEmail("jane.smith@example.com");
        newTenant.setPhone("+1 987-654-3210");

        when(tenantRepository.findByNationalId(newTenant.getNationalId())).thenReturn(null);
        when(tenantRepository.findByEmail(newTenant.getEmail())).thenReturn(null);
        when(tenantRepository.save(newTenant)).thenReturn(testTenant);

        // When
        Tenant result = tenantService.createTenant(newTenant);

        // Then
        assertNotNull(result);
        assertEquals(testTenant.getId(), result.getId());
        verify(tenantRepository, times(1)).findByNationalId(newTenant.getNationalId());
        verify(tenantRepository, times(1)).findByEmail(newTenant.getEmail());
        verify(tenantRepository, times(1)).save(newTenant);
    }

    @Test
    void testCreateTenant_DuplicateNationalId() {
        // Given
        Tenant newTenant = new Tenant();
        newTenant.setNationalId("12345678");
        newTenant.setEmail("new@example.com");

        when(tenantRepository.findByNationalId(newTenant.getNationalId())).thenReturn(testTenant);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tenantService.createTenant(newTenant));

        assertEquals("A tenant with this national ID already exists", exception.getMessage());
        verify(tenantRepository, times(1)).findByNationalId(newTenant.getNationalId());
        verify(tenantRepository, never()).save(any(Tenant.class));
    }

    @Test
    void testCreateTenant_DuplicateEmail() {
        // Given
        Tenant newTenant = new Tenant();
        newTenant.setNationalId("99999999");
        newTenant.setEmail("john.doe@example.com");

        when(tenantRepository.findByNationalId(newTenant.getNationalId())).thenReturn(null);
        when(tenantRepository.findByEmail(newTenant.getEmail())).thenReturn(testTenant);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tenantService.createTenant(newTenant));

        assertEquals("A tenant with this email already exists", exception.getMessage());
        verify(tenantRepository, times(1)).findByEmail(newTenant.getEmail());
        verify(tenantRepository, never()).save(any(Tenant.class));
    }

    @Test
    void testGetAllTenants_Success() {
        // Given
        Tenant tenant2 = new Tenant();
        tenant2.setId(2L);
        tenant2.setFullName("Jane Smith");

        List<Tenant> tenants = Arrays.asList(testTenant, tenant2);
        when(tenantRepository.findAll()).thenReturn(tenants);

        // When
        List<Tenant> result = tenantService.getAllTenants();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(tenantRepository, times(1)).findAll();
    }

    @Test
    void testGetTenantById_Success() {
        // Given
        Long tenantId = 1L;
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(testTenant));

        // When
        Optional<Tenant> result = tenantService.getTenantById(tenantId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testTenant.getId(), result.get().getId());
        verify(tenantRepository, times(1)).findById(tenantId);
    }

    @Test
    void testGetTenantById_NotFound() {
        // Given
        Long tenantId = 999L;
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        // When
        Optional<Tenant> result = tenantService.getTenantById(tenantId);

        // Then
        assertFalse(result.isPresent());
        verify(tenantRepository, times(1)).findById(tenantId);
    }

    @Test
    void testUpdateTenant_Success() {
        // Given
        Long tenantId = 1L;
        Tenant updateData = new Tenant();
        updateData.setFullName("John Updated");
        updateData.setNationalId("12345678");
        updateData.setEmail("john.updated@example.com");
        updateData.setPhone("+1 111-222-3333");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(testTenant));
        when(tenantRepository.save(any(Tenant.class))).thenReturn(testTenant);

        // When
        Tenant result = tenantService.updateTenant(tenantId, updateData);

        // Then
        assertNotNull(result);
        verify(tenantRepository, times(1)).findById(tenantId);
        verify(tenantRepository, times(1)).save(testTenant);
    }

    @Test
    void testUpdateTenant_NotFound() {
        // Given
        Long tenantId = 999L;
        Tenant updateData = new Tenant();
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        // When & Then
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> tenantService.updateTenant(tenantId, updateData));

        assertEquals("Tenant not found with id: " + tenantId, exception.getMessage());
        verify(tenantRepository, times(1)).findById(tenantId);
        verify(tenantRepository, never()).save(any(Tenant.class));
    }

    @Test
    void testUpdateTenant_DuplicateNationalId() {
        // Given
        Long tenantId = 1L;
        Tenant existingTenant2 = new Tenant();
        existingTenant2.setId(2L);
        existingTenant2.setNationalId("87654321");

        Tenant updateData = new Tenant();
        updateData.setNationalId("87654321");
        updateData.setEmail("john.doe@example.com");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(testTenant));
        when(tenantRepository.findByNationalId("87654321")).thenReturn(existingTenant2);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tenantService.updateTenant(tenantId, updateData));

        assertEquals("A tenant with this national ID already exists", exception.getMessage());
        verify(tenantRepository, times(1)).findByNationalId("87654321");
    }

    @Test
    void testDeleteTenant_Success() {
        // Given
        Long tenantId = 1L;
        when(tenantRepository.existsById(tenantId)).thenReturn(true);
        doNothing().when(tenantRepository).deleteById(tenantId);

        // When
        tenantService.deleteTenant(tenantId);

        // Then
        verify(tenantRepository, times(1)).existsById(tenantId);
        verify(tenantRepository, times(1)).deleteById(tenantId);
    }

    @Test
    void testDeleteTenant_NotFound() {
        // Given
        Long tenantId = 999L;
        when(tenantRepository.existsById(tenantId)).thenReturn(false);

        // When & Then
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> tenantService.deleteTenant(tenantId));

        assertEquals("Tenant not found with id: " + tenantId, exception.getMessage());
        verify(tenantRepository, times(1)).existsById(tenantId);
        verify(tenantRepository, never()).deleteById(anyLong());
    }

    @Test
    void testGetTenantByNationalId_Success() {
        // Given
        String nationalId = "12345678";
        when(tenantRepository.findByNationalId(nationalId)).thenReturn(testTenant);

        // When
        Optional<Tenant> result = tenantService.getTenantByNationalId(nationalId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testTenant.getId(), result.get().getId());
        verify(tenantRepository, times(1)).findByNationalId(nationalId);
    }

    @Test
    void testGetTenantByNationalId_NotFound() {
        // Given
        String nationalId = "99999999";
        when(tenantRepository.findByNationalId(nationalId)).thenReturn(null);

        // When
        Optional<Tenant> result = tenantService.getTenantByNationalId(nationalId);

        // Then
        assertFalse(result.isPresent());
        verify(tenantRepository, times(1)).findByNationalId(nationalId);
    }

    @Test
    void testGetTenantByEmail_Success() {
        // Given
        String email = "john.doe@example.com";
        when(tenantRepository.findByEmail(email)).thenReturn(testTenant);

        // When
        Optional<Tenant> result = tenantService.getTenantByEmail(email);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testTenant.getEmail(), result.get().getEmail());
        verify(tenantRepository, times(1)).findByEmail(email);
    }

    @Test
    void testGetTenantByEmail_NotFound() {
        // Given
        String email = "nonexistent@example.com";
        when(tenantRepository.findByEmail(email)).thenReturn(null);

        // When
        Optional<Tenant> result = tenantService.getTenantByEmail(email);

        // Then
        assertFalse(result.isPresent());
        verify(tenantRepository, times(1)).findByEmail(email);
    }
}

