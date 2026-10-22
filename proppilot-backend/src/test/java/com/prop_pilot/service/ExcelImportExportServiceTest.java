package com.prop_pilot.service;

import com.prop_pilot.dto.excel.*;
import com.prop_pilot.entity.*;
import com.prop_pilot.repository.*;
import com.prop_pilot.service.impl.ExcelImportExportServiceImpl;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExcelImportExportServiceTest {

    @Mock
    private PropertyUnitRepository propertyUnitRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private LeaseRepository leaseRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExcelImportExportServiceImpl excelService;

    private User testOwner;
    private PropertyUnit testProperty;
    private Tenant testTenant;
    private Lease testLease;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        testOwner = new User();
        testOwner.setId(1L);
        testOwner.setEmail("owner@test.com");
        testOwner.setFullName("Test Owner");

        testProperty = new PropertyUnit();
        testProperty.setId(1L);
        testProperty.setStreet("Av. Corrientes");
        testProperty.setStreetNumber("1234");
        testProperty.setFloor("5");
        testProperty.setApartment("A");
        testProperty.setCity("Buenos Aires");
        testProperty.setProvince("CABA");
        testProperty.setPostalCode("1043");
        testProperty.setType("apartment");
        testProperty.setBaseRentAmount(new BigDecimal("150000"));
        testProperty.setAddress("Av. Corrientes 1234 5A, Buenos Aires, CABA");
        testProperty.setOwner(testOwner);

        testTenant = new Tenant();
        testTenant.setId(1L);
        testTenant.setFullName("Juan Perez");
        testTenant.setNationalId("30123456");
        testTenant.setEmail("juan@test.com");
        testTenant.setPhone("1155551234");
        testTenant.setOwner(testOwner);

        testLease = new Lease();
        testLease.setId(1L);
        testLease.setPropertyUnit(testProperty);
        testLease.setTenants(new HashSet<>(Collections.singletonList(testTenant)));
        testLease.setStartDate(LocalDate.of(2024, 1, 1));
        testLease.setEndDate(LocalDate.of(2026, 1, 1));
        testLease.setMonthlyRent(new BigDecimal("150000"));
        testLease.setAdjustmentIndex(Lease.AdjustmentIndex.ICL);
        testLease.setAdjustmentFrequencyMonths(12);
        testLease.setStatus(Lease.LeaseStatus.ACTIVE);
        testLease.setOwner(testOwner);

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setLease(testLease);
        testPayment.setAmount(new BigDecimal("150000"));
        testPayment.setPaymentDate(LocalDate.of(2024, 2, 5));
        testPayment.setPaymentType(Payment.PaymentType.RENT);
        testPayment.setStatus(Payment.PaymentStatus.PAID);
        testPayment.setOwner(testOwner);
    }

    @Test
    void exportAll_ShouldGenerateValidExcelFile() throws Exception {
        // Arrange
        when(propertyUnitRepository.findByOwnerId(1L)).thenReturn(List.of(testProperty));
        when(tenantRepository.findByOwnerId(1L)).thenReturn(List.of(testTenant));
        when(leaseRepository.findByOwnerIdAndDeletedFalse(1L)).thenReturn(List.of(testLease));
        when(paymentRepository.findByOwnerId(1L)).thenReturn(List.of(testPayment));

        // Act
        byte[] result = excelService.exportAll(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);

        // Verify the Excel structure
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertEquals(4, workbook.getNumberOfSheets());
            assertNotNull(workbook.getSheet("Propiedades"));
            assertNotNull(workbook.getSheet("Inquilinos"));
            assertNotNull(workbook.getSheet("Contratos"));
            assertNotNull(workbook.getSheet("Pagos"));

            // Verify property data
            Sheet propertiesSheet = workbook.getSheet("Propiedades");
            assertEquals(2, propertiesSheet.getPhysicalNumberOfRows()); // Header + 1 data row
            Row dataRow = propertiesSheet.getRow(1);
            assertEquals("Av. Corrientes", dataRow.getCell(0).getStringCellValue());

            // Verify tenant data
            Sheet tenantsSheet = workbook.getSheet("Inquilinos");
            assertEquals(2, tenantsSheet.getPhysicalNumberOfRows());
            assertEquals("Juan Perez", tenantsSheet.getRow(1).getCell(0).getStringCellValue());
        }
    }

    @Test
    void generateTemplate_ShouldCreateEmptyTemplateWithHeaders() throws Exception {
        // Act
        byte[] result = excelService.generateTemplate();

        // Assert
        assertNotNull(result);

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            assertEquals(5, workbook.getNumberOfSheets()); // 4 data sheets + Help

            // Verify headers exist
            Sheet propertiesSheet = workbook.getSheet("Propiedades");
            Row headerRow = propertiesSheet.getRow(0);
            assertEquals("Calle", headerRow.getCell(0).getStringCellValue());
            assertEquals("Numero", headerRow.getCell(1).getStringCellValue());

            // Verify Help sheet exists
            assertNotNull(workbook.getSheet("Ayuda"));
        }
    }

    @Test
    void previewImport_ShouldParseValidExcelFile() throws Exception {
        // Arrange
        byte[] excelBytes = createTestExcelFile();
        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        when(propertyUnitRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());
        when(tenantRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());

        // Act
        ExcelImportPreview preview = excelService.previewImport(file, 1L);

        // Assert
        assertNotNull(preview);
        assertEquals(1, preview.getProperties().size());
        assertEquals(1, preview.getTenants().size());
        assertTrue(preview.getProperties().get(0).isValid());
        assertTrue(preview.getTenants().get(0).isValid());
        assertEquals(ExcelRowPreview.ImportAction.CREATE, preview.getProperties().get(0).getAction());
    }

    @Test
    void previewImport_ShouldDetectDuplicates() throws Exception {
        // Arrange
        byte[] excelBytes = createTestExcelFile();
        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        // Property already exists
        when(propertyUnitRepository.findByOwnerId(1L)).thenReturn(List.of(testProperty));
        when(tenantRepository.findByOwnerId(1L)).thenReturn(List.of(testTenant));

        // Act
        ExcelImportPreview preview = excelService.previewImport(file, 1L);

        // Assert
        assertEquals(ExcelRowPreview.ImportAction.SKIP, preview.getProperties().get(0).getAction());
        assertEquals(ExcelRowPreview.ImportAction.SKIP, preview.getTenants().get(0).getAction());
    }

    @Test
    void previewImport_ShouldDetectValidationErrors() throws Exception {
        // Arrange - create file with invalid data (missing required fields)
        byte[] excelBytes = createInvalidExcelFile();
        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        when(propertyUnitRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());
        when(tenantRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());

        // Act
        ExcelImportPreview preview = excelService.previewImport(file, 1L);

        // Assert
        assertFalse(preview.getProperties().get(0).isValid());
        assertEquals(ExcelRowPreview.ImportAction.ERROR, preview.getProperties().get(0).getAction());
        assertTrue(preview.getProperties().get(0).getErrors().size() > 0);
    }

    @Test
    void executeImport_ShouldCreateNewRecords() {
        // Arrange
        ExcelImportPreview preview = createValidPreview();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testOwner));
        when(propertyUnitRepository.save(any(PropertyUnit.class))).thenAnswer(i -> {
            PropertyUnit p = i.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(i -> {
            Tenant t = i.getArgument(0);
            t.setId(1L);
            return t;
        });

        // Act
        ExcelImportResult result = excelService.executeImport(preview, 1L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(1, result.getPropertiesCreated());
        assertEquals(1, result.getTenantsCreated());
        assertEquals(0, result.getErrors());

        verify(propertyUnitRepository, times(1)).save(any(PropertyUnit.class));
        verify(tenantRepository, times(1)).save(any(Tenant.class));
    }

    @Test
    void executeImport_ShouldSkipExistingRecords() {
        // Arrange
        ExcelImportPreview preview = new ExcelImportPreview();
        preview.setProperties(List.of(
            ExcelRowPreview.<PropertyUnitExcelRow>builder()
                .rowNumber(2)
                .data(PropertyUnitExcelRow.builder()
                    .street("Av. Corrientes")
                    .streetNumber("1234")
                    .type("apartment")
                    .baseRentAmount(new BigDecimal("150000"))
                    .build())
                .action(ExcelRowPreview.ImportAction.SKIP)
                .valid(true)
                .errors(new ArrayList<>())
                .warnings(List.of("Ya existe"))
                .build()
        ));
        preview.setTenants(Collections.emptyList());
        preview.setLeases(Collections.emptyList());
        preview.setPayments(Collections.emptyList());

        when(userRepository.findById(1L)).thenReturn(Optional.of(testOwner));

        // Act
        ExcelImportResult result = excelService.executeImport(preview, 1L);

        // Assert
        assertEquals(0, result.getPropertiesCreated());
        assertEquals(1, result.getSkipped());

        verify(propertyUnitRepository, never()).save(any(PropertyUnit.class));
    }

    // Helper methods

    private byte[] createTestExcelFile() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Properties sheet
            Sheet propertiesSheet = workbook.createSheet("Propiedades");
            Row headerRow = propertiesSheet.createRow(0);
            headerRow.createCell(0).setCellValue("Calle");
            headerRow.createCell(1).setCellValue("Numero");
            headerRow.createCell(2).setCellValue("Piso");
            headerRow.createCell(3).setCellValue("Depto");
            headerRow.createCell(4).setCellValue("Ciudad");
            headerRow.createCell(5).setCellValue("Provincia");
            headerRow.createCell(6).setCellValue("Codigo Postal");
            headerRow.createCell(7).setCellValue("Tipo");
            headerRow.createCell(8).setCellValue("Alquiler Base");

            Row dataRow = propertiesSheet.createRow(1);
            dataRow.createCell(0).setCellValue("Av. Corrientes");
            dataRow.createCell(1).setCellValue("1234");
            dataRow.createCell(2).setCellValue("5");
            dataRow.createCell(3).setCellValue("A");
            dataRow.createCell(4).setCellValue("Buenos Aires");
            dataRow.createCell(5).setCellValue("CABA");
            dataRow.createCell(6).setCellValue("1043");
            dataRow.createCell(7).setCellValue("apartment");
            dataRow.createCell(8).setCellValue(150000);

            // Tenants sheet
            Sheet tenantsSheet = workbook.createSheet("Inquilinos");
            Row tenantHeader = tenantsSheet.createRow(0);
            tenantHeader.createCell(0).setCellValue("Nombre Completo");
            tenantHeader.createCell(1).setCellValue("DNI/CUIT");
            tenantHeader.createCell(2).setCellValue("Email");
            tenantHeader.createCell(3).setCellValue("Telefono");

            Row tenantData = tenantsSheet.createRow(1);
            tenantData.createCell(0).setCellValue("Juan Perez");
            tenantData.createCell(1).setCellValue("30123456");
            tenantData.createCell(2).setCellValue("juan@test.com");
            tenantData.createCell(3).setCellValue("1155551234");

            // Empty sheets for leases and payments
            workbook.createSheet("Contratos");
            workbook.createSheet("Pagos");

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] createInvalidExcelFile() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet propertiesSheet = workbook.createSheet("Propiedades");
            Row headerRow = propertiesSheet.createRow(0);
            headerRow.createCell(0).setCellValue("Calle");
            headerRow.createCell(1).setCellValue("Numero");
            headerRow.createCell(7).setCellValue("Tipo");
            headerRow.createCell(8).setCellValue("Alquiler Base");

            // Missing required fields
            Row dataRow = propertiesSheet.createRow(1);
            dataRow.createCell(0).setCellValue(""); // Empty street
            dataRow.createCell(1).setCellValue(""); // Empty number
            dataRow.createCell(7).setCellValue("");
            dataRow.createCell(8).setCellValue(-100); // Negative rent

            Sheet tenantsSheet = workbook.createSheet("Inquilinos");
            Row tenantHeader = tenantsSheet.createRow(0);
            tenantHeader.createCell(0).setCellValue("Nombre Completo");
            tenantHeader.createCell(1).setCellValue("DNI/CUIT");

            workbook.createSheet("Contratos");
            workbook.createSheet("Pagos");

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private ExcelImportPreview createValidPreview() {
        ExcelImportPreview preview = new ExcelImportPreview();

        preview.setProperties(List.of(
            ExcelRowPreview.<PropertyUnitExcelRow>builder()
                .rowNumber(2)
                .data(PropertyUnitExcelRow.builder()
                    .street("Av. Santa Fe")
                    .streetNumber("5678")
                    .type("apartment")
                    .baseRentAmount(new BigDecimal("200000"))
                    .build())
                .action(ExcelRowPreview.ImportAction.CREATE)
                .valid(true)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build()
        ));

        preview.setTenants(List.of(
            ExcelRowPreview.<TenantExcelRow>builder()
                .rowNumber(2)
                .data(TenantExcelRow.builder()
                    .fullName("Maria Garcia")
                    .nationalId("40567890")
                    .email("maria@test.com")
                    .phone("1166662345")
                    .build())
                .action(ExcelRowPreview.ImportAction.CREATE)
                .valid(true)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build()
        ));

        preview.setLeases(Collections.emptyList());
        preview.setPayments(Collections.emptyList());

        return preview;
    }
}
