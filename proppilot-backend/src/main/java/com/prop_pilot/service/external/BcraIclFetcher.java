package com.prop_pilot.service.external;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
public class BcraIclFetcher implements ExternalIndexFetcher {

    private static final String XLS_URL = "https://www.bcra.gob.ar/Pdfs/PublicacionesEstadisticas/diar_icl.xls";
    private static final String SOURCE = "bcra.gob.ar";

    private final WebClient webClient;

    public BcraIclFetcher(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public List<IndexType> getSupportedIndexTypes() {
        return List.of(IndexType.ICL);
    }

    @Override
    public String getCountryCode() {
        return "AR";
    }

    @Override
    public List<IndexValue> fetchLatestValues() {
        List<IndexValue> results = new ArrayList<>();

        try {
            byte[] xlsBytes = webClient.get()
                .uri(XLS_URL)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();
            log.info("Downloaded ICL Excel file: {} bytes", xlsBytes.length);

            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(xlsBytes);
                 Workbook workbook = new HSSFWorkbook(inputStream)) {

                Sheet sheet = workbook.getSheetAt(0);
                if (sheet == null) {
                    log.warn("No sheet found in ICL Excel file");
                    return results;
                }

                // Find the last row with data (ICL values are typically in a two-column format: date, value)
                LocalDate latestDate = null;
                BigDecimal latestValue = null;

                // Start from row 3 (0-indexed row 2) to skip headers
                for (int rowNum = 2; rowNum <= sheet.getLastRowNum(); rowNum++) {
                    Row row = sheet.getRow(rowNum);
                    if (row == null) continue;

                    Cell dateCell = row.getCell(0);
                    Cell valueCell = row.getCell(1);

                    if (dateCell == null || valueCell == null) continue;

                    LocalDate date = extractDate(dateCell);
                    BigDecimal value = extractNumeric(valueCell);

                    if (date != null && value != null) {
                        if (latestDate == null || date.isAfter(latestDate)) {
                            latestDate = date;
                            latestValue = value;
                        }
                    }
                }

                if (latestDate != null && latestValue != null) {
                    IndexValue indexValue = IndexValue.builder()
                        .indexType(IndexType.ICL)
                        .countryCode(getCountryCode())
                        .valueDate(latestDate)
                        .value(latestValue)
                        .source(SOURCE)
                        .rawResponse("Excel row - date: " + latestDate + ", value: " + latestValue)
                        .build();

                    results.add(indexValue);
                    log.info("Fetched ICL = {} for date {}", latestValue, latestDate);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching ICL from BCRA Excel: {}", e.getMessage(), e);
        }

        return results;
    }

    private LocalDate extractDate(Cell cell) {
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                    Date date = cell.getDateCellValue();
                    return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                }
            } else if (cell.getCellType() == CellType.STRING) {
                String dateStr = cell.getStringCellValue().trim();
                // BCRA Excel uses dd/MM/yyyy format (e.g., "01/07/2020")
                if (dateStr.contains("/")) {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    return LocalDate.parse(dateStr, formatter);
                }
                // Fallback to ISO format
                return LocalDate.parse(dateStr);
            }
        } catch (Exception e) {
            log.trace("Could not parse date from cell: {}", e.getMessage());
        }
        return null;
    }

    private BigDecimal extractNumeric(Cell cell) {
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim()
                    .replace(",", ".");
                return new BigDecimal(value);
            }
        } catch (Exception e) {
            log.trace("Could not parse numeric from cell: {}", e.getMessage());
        }
        return null;
    }
}
