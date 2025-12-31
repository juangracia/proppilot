package com.prop_pilot.service.impl;

import com.prop_pilot.dto.excel.*;
import com.prop_pilot.entity.*;
import com.prop_pilot.repository.*;
import com.prop_pilot.service.ExcelImportExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelImportExportServiceImpl implements ExcelImportExportService {

    private final PropertyUnitRepository propertyUnitRepository;
    private final TenantRepository tenantRepository;
    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    // Sheet names in Spanish
    private static final String SHEET_PROPERTIES = "Propiedades";
    private static final String SHEET_TENANTS = "Inquilinos";
    private static final String SHEET_LEASES = "Contratos";
    private static final String SHEET_PAYMENTS = "Pagos";
    private static final String SHEET_HELP = "Ayuda";

    // Column headers
    private static final String[] PROPERTY_HEADERS = {
        "Calle", "Numero", "Piso", "Depto", "Ciudad", "Provincia", "Codigo Postal", "Tipo", "Alquiler Base"
    };
    private static final String[] TENANT_HEADERS = {
        "Nombre Completo", "DNI/CUIT", "Email", "Telefono"
    };
    private static final String[] LEASE_HEADERS = {
        "Direccion Propiedad", "DNI Inquilino", "Fecha Inicio", "Fecha Fin",
        "Alquiler Mensual", "Indice Ajuste", "Frecuencia Ajuste (meses)", "Estado"
    };
    private static final String[] PAYMENT_HEADERS = {
        "Direccion Propiedad", "DNI Inquilino", "Fecha Inicio Contrato",
        "Monto", "Fecha Pago", "Tipo", "Estado", "Descripcion"
    };

    @Override
    public byte[] exportAll(Long ownerId) {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Export each entity type to its own sheet
            exportProperties(workbook, ownerId, headerStyle, currencyStyle);
            exportTenants(workbook, ownerId, headerStyle);
            exportLeases(workbook, ownerId, headerStyle, dateStyle, currencyStyle);
            exportPayments(workbook, ownerId, headerStyle, dateStyle, currencyStyle);

            // Write to byte array
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel file", e);
        }
    }

    @Override
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);

            // Create empty sheets with headers
            createSheetWithHeaders(workbook, SHEET_PROPERTIES, PROPERTY_HEADERS, headerStyle);
            createSheetWithHeaders(workbook, SHEET_TENANTS, TENANT_HEADERS, headerStyle);
            createSheetWithHeaders(workbook, SHEET_LEASES, LEASE_HEADERS, headerStyle);
            createSheetWithHeaders(workbook, SHEET_PAYMENTS, PAYMENT_HEADERS, headerStyle);

            // Create help sheet
            createHelpSheet(workbook);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating template", e);
        }
    }

    @Override
    public ExcelImportPreview previewImport(MultipartFile file, Long ownerId) {
        ExcelImportPreview preview = new ExcelImportPreview();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            // Parse each sheet
            preview.setProperties(parsePropertiesSheet(workbook, ownerId));
            preview.setTenants(parseTenantsSheet(workbook, ownerId));
            preview.setLeases(parseLeasesSheet(workbook, ownerId, preview.getProperties(), preview.getTenants()));
            preview.setPayments(parsePaymentsSheet(workbook, ownerId, preview.getLeases()));

            preview.calculateStats();
        } catch (IOException e) {
            throw new RuntimeException("Error reading Excel file", e);
        }

        return preview;
    }

    @Override
    @Transactional
    public ExcelImportResult executeImport(ExcelImportPreview preview, Long ownerId) {
        ExcelImportResult result = ExcelImportResult.builder()
            .errorMessages(new ArrayList<>())
            .build();

        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Maps to track created entities for relationship linking
        Map<String, PropertyUnit> createdProperties = new HashMap<>();
        Map<String, Tenant> createdTenants = new HashMap<>();
        Map<String, Lease> createdLeases = new HashMap<>();

        // Import properties first
        for (var row : preview.getProperties()) {
            if (row.isValid() && row.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                try {
                    PropertyUnit property = createPropertyFromRow(row.getData(), owner);
                    property = propertyUnitRepository.save(property);
                    createdProperties.put(property.getAddress().toLowerCase(), property);
                    result.setPropertiesCreated(result.getPropertiesCreated() + 1);
                } catch (Exception e) {
                    result.getErrorMessages().add("Property row " + row.getRowNumber() + ": " + e.getMessage());
                    result.setErrors(result.getErrors() + 1);
                }
            } else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) {
                result.setSkipped(result.getSkipped() + 1);
            }
        }

        // Import tenants
        for (var row : preview.getTenants()) {
            if (row.isValid() && row.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                try {
                    Tenant tenant = createTenantFromRow(row.getData(), owner);
                    tenant = tenantRepository.save(tenant);
                    createdTenants.put(tenant.getNationalId(), tenant);
                    result.setTenantsCreated(result.getTenantsCreated() + 1);
                } catch (Exception e) {
                    result.getErrorMessages().add("Tenant row " + row.getRowNumber() + ": " + e.getMessage());
                    result.setErrors(result.getErrors() + 1);
                }
            } else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) {
                result.setSkipped(result.getSkipped() + 1);
            }
        }

        // Import leases (need to resolve property and tenant references)
        for (var row : preview.getLeases()) {
            if (row.isValid() && row.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                try {
                    Lease lease = createLeaseFromRow(row.getData(), owner, ownerId, createdProperties, createdTenants);
                    lease = leaseRepository.save(lease);
                    String leaseKey = buildLeaseKey(row.getData());
                    createdLeases.put(leaseKey, lease);
                    result.setLeasesCreated(result.getLeasesCreated() + 1);
                } catch (Exception e) {
                    result.getErrorMessages().add("Lease row " + row.getRowNumber() + ": " + e.getMessage());
                    result.setErrors(result.getErrors() + 1);
                }
            } else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) {
                result.setSkipped(result.getSkipped() + 1);
            }
        }

        // Import payments
        for (var row : preview.getPayments()) {
            if (row.isValid() && row.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                try {
                    Payment payment = createPaymentFromRow(row.getData(), owner, ownerId, createdLeases);
                    paymentRepository.save(payment);
                    result.setPaymentsCreated(result.getPaymentsCreated() + 1);
                } catch (Exception e) {
                    result.getErrorMessages().add("Payment row " + row.getRowNumber() + ": " + e.getMessage());
                    result.setErrors(result.getErrors() + 1);
                }
            } else if (row.getAction() == ExcelRowPreview.ImportAction.SKIP) {
                result.setSkipped(result.getSkipped() + 1);
            }
        }

        result.setSuccess(result.getErrors() == 0);
        return result;
    }

    // ==================== EXPORT METHODS ====================

    private void exportProperties(Workbook workbook, Long ownerId, CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet(SHEET_PROPERTIES);
        createHeaderRow(sheet, PROPERTY_HEADERS, headerStyle);

        List<PropertyUnit> properties = propertyUnitRepository.findByOwnerId(ownerId);
        int rowNum = 1;
        for (PropertyUnit p : properties) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(p.getStreet() != null ? p.getStreet() : "");
            row.createCell(1).setCellValue(p.getStreetNumber() != null ? p.getStreetNumber() : "");
            row.createCell(2).setCellValue(p.getFloor() != null ? p.getFloor() : "");
            row.createCell(3).setCellValue(p.getApartment() != null ? p.getApartment() : "");
            row.createCell(4).setCellValue(p.getCity() != null ? p.getCity() : "");
            row.createCell(5).setCellValue(p.getProvince() != null ? p.getProvince() : "");
            row.createCell(6).setCellValue(p.getPostalCode() != null ? p.getPostalCode() : "");
            row.createCell(7).setCellValue(p.getType() != null ? p.getType() : "");
            Cell rentCell = row.createCell(8);
            if (p.getBaseRentAmount() != null) {
                rentCell.setCellValue(p.getBaseRentAmount().doubleValue());
                rentCell.setCellStyle(currencyStyle);
            }
        }
        autoSizeColumns(sheet, PROPERTY_HEADERS.length);
    }

    private void exportTenants(Workbook workbook, Long ownerId, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet(SHEET_TENANTS);
        createHeaderRow(sheet, TENANT_HEADERS, headerStyle);

        List<Tenant> tenants = tenantRepository.findByOwnerId(ownerId);
        int rowNum = 1;
        for (Tenant t : tenants) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(t.getFullName() != null ? t.getFullName() : "");
            row.createCell(1).setCellValue(t.getNationalId() != null ? t.getNationalId() : "");
            row.createCell(2).setCellValue(t.getEmail() != null ? t.getEmail() : "");
            row.createCell(3).setCellValue(t.getPhone() != null ? t.getPhone() : "");
        }
        autoSizeColumns(sheet, TENANT_HEADERS.length);
    }

    private void exportLeases(Workbook workbook, Long ownerId, CellStyle headerStyle, CellStyle dateStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet(SHEET_LEASES);
        createHeaderRow(sheet, LEASE_HEADERS, headerStyle);

        List<Lease> leases = leaseRepository.findByOwnerIdAndDeletedFalse(ownerId);
        int rowNum = 1;
        for (Lease l : leases) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(l.getPropertyUnit() != null ? l.getPropertyUnit().getFullAddress() : "");

            // Get tenant national IDs as comma-separated string
            String tenantIds = l.getTenants().stream()
                .map(Tenant::getNationalId)
                .collect(Collectors.joining(", "));
            row.createCell(1).setCellValue(tenantIds);

            setCellDate(row.createCell(2), l.getStartDate(), dateStyle);
            setCellDate(row.createCell(3), l.getEndDate(), dateStyle);

            Cell rentCell = row.createCell(4);
            if (l.getMonthlyRent() != null) {
                rentCell.setCellValue(l.getMonthlyRent().doubleValue());
                rentCell.setCellStyle(currencyStyle);
            }

            row.createCell(5).setCellValue(l.getAdjustmentIndex() != null ? l.getAdjustmentIndex().name() : "");
            row.createCell(6).setCellValue(l.getAdjustmentFrequencyMonths() != null ? l.getAdjustmentFrequencyMonths() : 12);
            row.createCell(7).setCellValue(l.getStatus() != null ? l.getStatus().name() : "");
        }
        autoSizeColumns(sheet, LEASE_HEADERS.length);
    }

    private void exportPayments(Workbook workbook, Long ownerId, CellStyle headerStyle, CellStyle dateStyle, CellStyle currencyStyle) {
        Sheet sheet = workbook.createSheet(SHEET_PAYMENTS);
        createHeaderRow(sheet, PAYMENT_HEADERS, headerStyle);

        List<Payment> payments = paymentRepository.findByOwnerId(ownerId);
        int rowNum = 1;
        for (Payment p : payments) {
            Row row = sheet.createRow(rowNum++);

            Lease lease = p.getLease();
            row.createCell(0).setCellValue(lease != null && lease.getPropertyUnit() != null
                ? lease.getPropertyUnit().getFullAddress() : "");

            String tenantId = lease != null && !lease.getTenants().isEmpty()
                ? lease.getTenants().iterator().next().getNationalId() : "";
            row.createCell(1).setCellValue(tenantId);

            setCellDate(row.createCell(2), lease != null ? lease.getStartDate() : null, dateStyle);

            Cell amountCell = row.createCell(3);
            if (p.getAmount() != null) {
                amountCell.setCellValue(p.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);
            }

            setCellDate(row.createCell(4), p.getPaymentDate(), dateStyle);
            row.createCell(5).setCellValue(p.getPaymentType() != null ? p.getPaymentType().name() : "");
            row.createCell(6).setCellValue(p.getStatus() != null ? p.getStatus().name() : "");
            row.createCell(7).setCellValue(p.getDescription() != null ? p.getDescription() : "");
        }
        autoSizeColumns(sheet, PAYMENT_HEADERS.length);
    }

    // ==================== PARSE METHODS ====================

    private List<ExcelRowPreview<PropertyUnitExcelRow>> parsePropertiesSheet(Workbook workbook, Long ownerId) {
        List<ExcelRowPreview<PropertyUnitExcelRow>> result = new ArrayList<>();
        Sheet sheet = workbook.getSheet(SHEET_PROPERTIES);
        if (sheet == null) return result;

        // Load existing properties for duplicate detection
        List<PropertyUnit> existingProperties = propertyUnitRepository.findByOwnerId(ownerId);
        Set<String> existingAddresses = existingProperties.stream()
            .map(p -> p.getAddress().toLowerCase().trim())
            .collect(Collectors.toSet());

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            PropertyUnitExcelRow data = PropertyUnitExcelRow.builder()
                .street(getStringValue(row.getCell(0)))
                .streetNumber(getStringValue(row.getCell(1)))
                .floor(getStringValue(row.getCell(2)))
                .apartment(getStringValue(row.getCell(3)))
                .city(getStringValue(row.getCell(4)))
                .province(getStringValue(row.getCell(5)))
                .postalCode(getStringValue(row.getCell(6)))
                .type(getStringValue(row.getCell(7)))
                .baseRentAmount(getDecimalValue(row.getCell(8)))
                .build();

            ExcelRowPreview<PropertyUnitExcelRow> preview = ExcelRowPreview.<PropertyUnitExcelRow>builder()
                .rowNumber(i + 1)
                .data(data)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build();

            // Validate
            validatePropertyRow(data, preview);

            // Check for duplicates
            if (preview.getErrors().isEmpty()) {
                String normalizedAddress = data.getNormalizedAddress();
                if (existingAddresses.contains(normalizedAddress)) {
                    preview.setAction(ExcelRowPreview.ImportAction.SKIP);
                    preview.getWarnings().add("Ya existe una propiedad con esta direccion");
                } else {
                    preview.setAction(ExcelRowPreview.ImportAction.CREATE);
                    existingAddresses.add(normalizedAddress); // Track for subsequent rows
                }
                preview.setValid(true);
            } else {
                preview.setAction(ExcelRowPreview.ImportAction.ERROR);
                preview.setValid(false);
            }

            result.add(preview);
        }
        return result;
    }

    private List<ExcelRowPreview<TenantExcelRow>> parseTenantsSheet(Workbook workbook, Long ownerId) {
        List<ExcelRowPreview<TenantExcelRow>> result = new ArrayList<>();
        Sheet sheet = workbook.getSheet(SHEET_TENANTS);
        if (sheet == null) return result;

        Set<String> existingNationalIds = tenantRepository.findByOwnerId(ownerId).stream()
            .map(Tenant::getNationalId)
            .collect(Collectors.toSet());

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            TenantExcelRow data = TenantExcelRow.builder()
                .fullName(getStringValue(row.getCell(0)))
                .nationalId(getStringValue(row.getCell(1)))
                .email(getStringValue(row.getCell(2)))
                .phone(getStringValue(row.getCell(3)))
                .build();

            ExcelRowPreview<TenantExcelRow> preview = ExcelRowPreview.<TenantExcelRow>builder()
                .rowNumber(i + 1)
                .data(data)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build();

            validateTenantRow(data, preview);

            if (preview.getErrors().isEmpty()) {
                if (existingNationalIds.contains(data.getNationalId())) {
                    preview.setAction(ExcelRowPreview.ImportAction.SKIP);
                    preview.getWarnings().add("Ya existe un inquilino con este DNI/CUIT");
                } else {
                    preview.setAction(ExcelRowPreview.ImportAction.CREATE);
                    existingNationalIds.add(data.getNationalId());
                }
                preview.setValid(true);
            } else {
                preview.setAction(ExcelRowPreview.ImportAction.ERROR);
                preview.setValid(false);
            }

            result.add(preview);
        }
        return result;
    }

    private List<ExcelRowPreview<LeaseExcelRow>> parseLeasesSheet(
            Workbook workbook, Long ownerId,
            List<ExcelRowPreview<PropertyUnitExcelRow>> propertyPreviews,
            List<ExcelRowPreview<TenantExcelRow>> tenantPreviews) {

        List<ExcelRowPreview<LeaseExcelRow>> result = new ArrayList<>();
        Sheet sheet = workbook.getSheet(SHEET_LEASES);
        if (sheet == null) return result;

        // Build lookup sets for validation
        Set<String> availableProperties = new HashSet<>();
        for (PropertyUnit p : propertyUnitRepository.findByOwnerId(ownerId)) {
            availableProperties.add(p.getAddress().toLowerCase().trim());
        }
        for (var pp : propertyPreviews) {
            if (pp.isValid() && pp.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                availableProperties.add(pp.getData().getNormalizedAddress());
            }
        }

        Set<String> availableTenants = new HashSet<>();
        for (Tenant t : tenantRepository.findByOwnerId(ownerId)) {
            availableTenants.add(t.getNationalId());
        }
        for (var tp : tenantPreviews) {
            if (tp.isValid() && tp.getAction() == ExcelRowPreview.ImportAction.CREATE) {
                availableTenants.add(tp.getData().getNationalId());
            }
        }

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            LeaseExcelRow data = LeaseExcelRow.builder()
                .propertyAddress(getStringValue(row.getCell(0)))
                .tenantNationalIds(getStringValue(row.getCell(1)))
                .startDate(getDateValue(row.getCell(2)))
                .endDate(getDateValue(row.getCell(3)))
                .monthlyRent(getDecimalValue(row.getCell(4)))
                .adjustmentIndex(getStringValue(row.getCell(5)))
                .adjustmentFrequencyMonths(getIntValue(row.getCell(6)))
                .status(getStringValue(row.getCell(7)))
                .build();

            ExcelRowPreview<LeaseExcelRow> preview = ExcelRowPreview.<LeaseExcelRow>builder()
                .rowNumber(i + 1)
                .data(data)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build();

            validateLeaseRow(data, preview, availableProperties, availableTenants);

            if (preview.getErrors().isEmpty()) {
                preview.setAction(ExcelRowPreview.ImportAction.CREATE);
                preview.setValid(true);
            } else {
                preview.setAction(ExcelRowPreview.ImportAction.ERROR);
                preview.setValid(false);
            }

            result.add(preview);
        }
        return result;
    }

    private List<ExcelRowPreview<PaymentExcelRow>> parsePaymentsSheet(
            Workbook workbook, Long ownerId,
            List<ExcelRowPreview<LeaseExcelRow>> leasePreviews) {

        List<ExcelRowPreview<PaymentExcelRow>> result = new ArrayList<>();
        Sheet sheet = workbook.getSheet(SHEET_PAYMENTS);
        if (sheet == null) return result;

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            PaymentExcelRow data = PaymentExcelRow.builder()
                .propertyAddress(getStringValue(row.getCell(0)))
                .tenantNationalId(getStringValue(row.getCell(1)))
                .leaseStartDate(getDateValue(row.getCell(2)))
                .amount(getDecimalValue(row.getCell(3)))
                .paymentDate(getDateValue(row.getCell(4)))
                .paymentType(getStringValue(row.getCell(5)))
                .status(getStringValue(row.getCell(6)))
                .description(getStringValue(row.getCell(7)))
                .build();

            ExcelRowPreview<PaymentExcelRow> preview = ExcelRowPreview.<PaymentExcelRow>builder()
                .rowNumber(i + 1)
                .data(data)
                .errors(new ArrayList<>())
                .warnings(new ArrayList<>())
                .build();

            validatePaymentRow(data, preview);

            if (preview.getErrors().isEmpty()) {
                preview.setAction(ExcelRowPreview.ImportAction.CREATE);
                preview.setValid(true);
            } else {
                preview.setAction(ExcelRowPreview.ImportAction.ERROR);
                preview.setValid(false);
            }

            result.add(preview);
        }
        return result;
    }

    // ==================== VALIDATION METHODS ====================

    private void validatePropertyRow(PropertyUnitExcelRow data, ExcelRowPreview<PropertyUnitExcelRow> preview) {
        if (data.getStreet() == null || data.getStreet().isBlank()) {
            preview.getErrors().add("Calle es requerida");
        }
        if (data.getStreetNumber() == null || data.getStreetNumber().isBlank()) {
            preview.getErrors().add("Numero es requerido");
        }
        if (data.getType() == null || data.getType().isBlank()) {
            preview.getErrors().add("Tipo es requerido");
        }
        if (data.getBaseRentAmount() == null || data.getBaseRentAmount().compareTo(BigDecimal.ZERO) <= 0) {
            preview.getErrors().add("Alquiler base debe ser mayor a 0");
        }
    }

    private void validateTenantRow(TenantExcelRow data, ExcelRowPreview<TenantExcelRow> preview) {
        if (data.getFullName() == null || data.getFullName().isBlank()) {
            preview.getErrors().add("Nombre completo es requerido");
        }
        if (data.getNationalId() == null || data.getNationalId().isBlank()) {
            preview.getErrors().add("DNI/CUIT es requerido");
        }
        if (data.getEmail() == null || data.getEmail().isBlank()) {
            preview.getErrors().add("Email es requerido");
        }
        if (data.getPhone() == null || data.getPhone().isBlank()) {
            preview.getErrors().add("Telefono es requerido");
        }
    }

    private void validateLeaseRow(LeaseExcelRow data, ExcelRowPreview<LeaseExcelRow> preview,
                                   Set<String> availableProperties, Set<String> availableTenants) {
        if (data.getPropertyAddress() == null || data.getPropertyAddress().isBlank()) {
            preview.getErrors().add("Direccion propiedad es requerida");
        } else {
            String normalized = data.getPropertyAddress().toLowerCase().trim();
            if (!availableProperties.contains(normalized)) {
                preview.getErrors().add("Propiedad no encontrada: " + data.getPropertyAddress());
            }
        }

        if (data.getTenantNationalIds() == null || data.getTenantNationalIds().isBlank()) {
            preview.getErrors().add("DNI inquilino es requerido");
        } else {
            for (String dni : data.getTenantNationalIds().split(",")) {
                if (!availableTenants.contains(dni.trim())) {
                    preview.getErrors().add("Inquilino no encontrado: " + dni.trim());
                }
            }
        }

        if (data.getStartDate() == null) {
            preview.getErrors().add("Fecha inicio es requerida");
        }
        if (data.getEndDate() == null) {
            preview.getErrors().add("Fecha fin es requerida");
        }
        if (data.getStartDate() != null && data.getEndDate() != null && !data.getEndDate().isAfter(data.getStartDate())) {
            preview.getErrors().add("Fecha fin debe ser posterior a fecha inicio");
        }
        if (data.getMonthlyRent() == null || data.getMonthlyRent().compareTo(BigDecimal.ZERO) <= 0) {
            preview.getErrors().add("Alquiler mensual debe ser mayor a 0");
        }

        // Validate adjustment index
        if (data.getAdjustmentIndex() != null && !data.getAdjustmentIndex().isBlank()) {
            try {
                Lease.AdjustmentIndex.valueOf(data.getAdjustmentIndex().toUpperCase());
            } catch (IllegalArgumentException e) {
                preview.getErrors().add("Indice de ajuste invalido: " + data.getAdjustmentIndex());
            }
        }

        // Validate status
        if (data.getStatus() != null && !data.getStatus().isBlank()) {
            try {
                Lease.LeaseStatus.valueOf(data.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                preview.getErrors().add("Estado invalido: " + data.getStatus());
            }
        }
    }

    private void validatePaymentRow(PaymentExcelRow data, ExcelRowPreview<PaymentExcelRow> preview) {
        if (data.getPropertyAddress() == null || data.getPropertyAddress().isBlank()) {
            preview.getErrors().add("Direccion propiedad es requerida");
        }
        if (data.getTenantNationalId() == null || data.getTenantNationalId().isBlank()) {
            preview.getErrors().add("DNI inquilino es requerido");
        }
        if (data.getLeaseStartDate() == null) {
            preview.getErrors().add("Fecha inicio contrato es requerida");
        }
        if (data.getAmount() == null || data.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            preview.getErrors().add("Monto debe ser mayor a 0");
        }
        if (data.getPaymentDate() == null) {
            preview.getErrors().add("Fecha pago es requerida");
        }

        // Validate payment type
        if (data.getPaymentType() != null && !data.getPaymentType().isBlank()) {
            try {
                Payment.PaymentType.valueOf(data.getPaymentType().toUpperCase());
            } catch (IllegalArgumentException e) {
                preview.getErrors().add("Tipo de pago invalido: " + data.getPaymentType());
            }
        }

        // Validate status
        if (data.getStatus() != null && !data.getStatus().isBlank()) {
            try {
                Payment.PaymentStatus.valueOf(data.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                preview.getErrors().add("Estado invalido: " + data.getStatus());
            }
        }
    }

    // ==================== ENTITY CREATION METHODS ====================

    private PropertyUnit createPropertyFromRow(PropertyUnitExcelRow data, User owner) {
        PropertyUnit property = new PropertyUnit();
        property.setStreet(data.getStreet());
        property.setStreetNumber(data.getStreetNumber());
        property.setFloor(data.getFloor());
        property.setApartment(data.getApartment());
        property.setCity(data.getCity());
        property.setProvince(data.getProvince());
        property.setPostalCode(data.getPostalCode());
        property.setType(data.getType());
        property.setBaseRentAmount(data.getBaseRentAmount());
        property.setAddress(data.getFullAddress()); // Set legacy address field
        property.setOwner(owner);
        return property;
    }

    private Tenant createTenantFromRow(TenantExcelRow data, User owner) {
        Tenant tenant = new Tenant();
        tenant.setFullName(data.getFullName());
        tenant.setNationalId(data.getNationalId());
        tenant.setEmail(data.getEmail());
        tenant.setPhone(data.getPhone());
        tenant.setOwner(owner);
        return tenant;
    }

    private Lease createLeaseFromRow(LeaseExcelRow data, User owner, Long ownerId,
                                      Map<String, PropertyUnit> createdProperties,
                                      Map<String, Tenant> createdTenants) {
        Lease lease = new Lease();

        // Find property
        String normalizedAddress = data.getPropertyAddress().toLowerCase().trim();
        PropertyUnit property = createdProperties.get(normalizedAddress);
        if (property == null) {
            property = propertyUnitRepository.findByAddressContainingIgnoreCaseAndOwnerId(
                data.getPropertyAddress(), ownerId).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Propiedad no encontrada: " + data.getPropertyAddress()));
        }
        lease.setPropertyUnit(property);

        // Find tenants
        Set<Tenant> tenants = new HashSet<>();
        for (String dni : data.getTenantNationalIds().split(",")) {
            String trimmedDni = dni.trim();
            Tenant tenant = createdTenants.get(trimmedDni);
            if (tenant == null) {
                tenant = tenantRepository.findByNationalIdAndOwnerId(trimmedDni, ownerId)
                    .orElseThrow(() -> new RuntimeException("Inquilino no encontrado: " + trimmedDni));
            }
            tenants.add(tenant);
        }
        lease.setTenants(tenants);

        lease.setStartDate(data.getStartDate());
        lease.setEndDate(data.getEndDate());
        lease.setMonthlyRent(data.getMonthlyRent());

        if (data.getAdjustmentIndex() != null && !data.getAdjustmentIndex().isBlank()) {
            lease.setAdjustmentIndex(Lease.AdjustmentIndex.valueOf(data.getAdjustmentIndex().toUpperCase()));
        }
        if (data.getAdjustmentFrequencyMonths() != null) {
            lease.setAdjustmentFrequencyMonths(data.getAdjustmentFrequencyMonths());
        }
        if (data.getStatus() != null && !data.getStatus().isBlank()) {
            lease.setStatus(Lease.LeaseStatus.valueOf(data.getStatus().toUpperCase()));
        }

        lease.setOwner(owner);
        return lease;
    }

    private Payment createPaymentFromRow(PaymentExcelRow data, User owner, Long ownerId,
                                          Map<String, Lease> createdLeases) {
        Payment payment = new Payment();

        // Find lease
        String leaseKey = data.getPropertyAddress().toLowerCase().trim() + "|" +
                          data.getTenantNationalId() + "|" + data.getLeaseStartDate();
        Lease lease = createdLeases.get(leaseKey);

        if (lease == null) {
            // Try to find existing lease
            List<Lease> leases = leaseRepository.findByOwnerIdAndDeletedFalse(ownerId);
            for (Lease l : leases) {
                if (l.getPropertyUnit().getAddress().toLowerCase().contains(data.getPropertyAddress().toLowerCase()) &&
                    l.getTenants().stream().anyMatch(t -> t.getNationalId().equals(data.getTenantNationalId())) &&
                    l.getStartDate().equals(data.getLeaseStartDate())) {
                    lease = l;
                    break;
                }
            }
        }

        if (lease == null) {
            throw new RuntimeException("Contrato no encontrado para el pago");
        }

        payment.setLease(lease);
        payment.setAmount(data.getAmount());
        payment.setPaymentDate(data.getPaymentDate());

        if (data.getPaymentType() != null && !data.getPaymentType().isBlank()) {
            payment.setPaymentType(Payment.PaymentType.valueOf(data.getPaymentType().toUpperCase()));
        }
        if (data.getStatus() != null && !data.getStatus().isBlank()) {
            payment.setStatus(Payment.PaymentStatus.valueOf(data.getStatus().toUpperCase()));
        }
        payment.setDescription(data.getDescription());
        payment.setOwner(owner);

        return payment;
    }

    private String buildLeaseKey(LeaseExcelRow data) {
        return data.getPropertyAddress().toLowerCase().trim() + "|" +
               data.getTenantNationalIds().split(",")[0].trim() + "|" +
               data.getStartDate();
    }

    // ==================== HELPER METHODS ====================

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("#,##0.00"));
        return style;
    }

    private void createSheetWithHeaders(Workbook workbook, String sheetName, String[] headers, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet(sheetName);
        createHeaderRow(sheet, headers, headerStyle);
        autoSizeColumns(sheet, headers.length);
    }

    private void createHeaderRow(Sheet sheet, String[] headers, CellStyle headerStyle) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void createHelpSheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet(SHEET_HELP);
        int row = 0;

        addHelpRow(sheet, row++, "INSTRUCCIONES PARA IMPORTAR DATOS", true);
        row++;
        addHelpRow(sheet, row++, "1. Complete cada hoja con los datos correspondientes", false);
        addHelpRow(sheet, row++, "2. Respete el formato de fechas: AAAA-MM-DD (ejemplo: 2024-01-15)", false);
        addHelpRow(sheet, row++, "3. Los montos deben ser numeros positivos", false);
        row++;
        addHelpRow(sheet, row++, "VALORES VALIDOS:", true);
        row++;
        addHelpRow(sheet, row++, "Tipo de propiedad: apartment, house, duplex, ph, studio, loft", false);
        addHelpRow(sheet, row++, "Indice de ajuste: ICL, IPC, DOLAR_BLUE, DOLAR_OFICIAL, DOLAR_MEP, NONE", false);
        addHelpRow(sheet, row++, "Estado contrato: ACTIVE, EXPIRED, TERMINATED", false);
        addHelpRow(sheet, row++, "Tipo de pago: RENT, DEPOSIT, MAINTENANCE, UTILITY, OTHER", false);
        addHelpRow(sheet, row++, "Estado pago: PAID, PENDING", false);

        sheet.setColumnWidth(0, 80 * 256);
    }

    private void addHelpRow(Sheet sheet, int rowNum, String text, boolean bold) {
        Row row = sheet.createRow(rowNum);
        Cell cell = row.createCell(0);
        cell.setCellValue(text);
        if (bold) {
            CellStyle style = sheet.getWorkbook().createCellStyle();
            Font font = sheet.getWorkbook().createFont();
            font.setBold(true);
            style.setFont(font);
            cell.setCellStyle(style);
        }
    }

    private void autoSizeColumns(Sheet sheet, int numColumns) {
        for (int i = 0; i < numColumns; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void setCellDate(Cell cell, LocalDate date, CellStyle dateStyle) {
        if (date != null) {
            cell.setCellValue(Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant()));
            cell.setCellStyle(dateStyle);
        }
    }

    private String getStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private BigDecimal getDecimalValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                try {
                    yield new BigDecimal(cell.getStringCellValue().trim().replace(",", "."));
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private Integer getIntValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> (int) cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Integer.parseInt(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private LocalDate getDateValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getLocalDateTimeCellValue().toLocalDate();
            case STRING -> {
                String val = cell.getStringCellValue().trim();
                try {
                    yield LocalDate.parse(val);
                } catch (Exception e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getStringValue(cell);
                if (value != null && !value.isBlank()) {
                    return false;
                }
            }
        }
        return true;
    }
}
