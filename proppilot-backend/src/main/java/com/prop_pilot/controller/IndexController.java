package com.prop_pilot.controller;

import com.prop_pilot.dto.index.IndexValueDto;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import com.prop_pilot.service.IndexValueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/indices")
@Tag(name = "Index Values", description = "API for economic index values (ICL, IPC, dollar rates)")
public class IndexController {

    private final IndexValueService indexValueService;

    public IndexController(IndexValueService indexValueService) {
        this.indexValueService = indexValueService;
    }

    @GetMapping("/{countryCode}/{type}/latest")
    @Operation(summary = "Get latest index value", description = "Returns the most recent value for a specific index type and country")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Index value found"),
        @ApiResponse(responseCode = "404", description = "No data available for this index")
    })
    public ResponseEntity<IndexValueDto> getLatestValue(
            @PathVariable String countryCode,
            @PathVariable IndexType type) {

        return indexValueService.getLatestValue(countryCode.toUpperCase(), type)
            .map(this::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{countryCode}/{type}/date/{date}")
    @Operation(summary = "Get index value for specific date", description = "Returns the index value for a specific date")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Index value found"),
        @ApiResponse(responseCode = "404", description = "No data available for this date")
    })
    public ResponseEntity<IndexValueDto> getValueForDate(
            @PathVariable String countryCode,
            @PathVariable IndexType type,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return indexValueService.getValueForDate(countryCode.toUpperCase(), type, date)
            .map(this::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{countryCode}/{type}/closest")
    @Operation(summary = "Get closest index value", description = "Returns the closest index value on or before the specified date")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Index value found"),
        @ApiResponse(responseCode = "404", description = "No data available")
    })
    public ResponseEntity<IndexValueDto> getClosestValue(
            @PathVariable String countryCode,
            @PathVariable IndexType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return indexValueService.getClosestValue(countryCode.toUpperCase(), type, date)
            .map(this::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{countryCode}/{type}/history")
    @Operation(summary = "Get index value history", description = "Returns index values within a date range")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved history")
    public ResponseEntity<List<IndexValueDto>> getHistory(
            @PathVariable String countryCode,
            @PathVariable IndexType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<IndexValueDto> history = indexValueService.getHistory(countryCode.toUpperCase(), type, from, to)
            .stream()
            .map(this::toDto)
            .toList();

        return ResponseEntity.ok(history);
    }

    @GetMapping("/{countryCode}/all/latest")
    @Operation(summary = "Get all latest values for country", description = "Returns the latest values for all index types in a country")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all latest values")
    public ResponseEntity<List<IndexValueDto>> getAllLatestValues(@PathVariable String countryCode) {
        List<IndexValueDto> values = indexValueService.getAllLatestValues(countryCode.toUpperCase())
            .stream()
            .map(this::toDto)
            .toList();

        return ResponseEntity.ok(values);
    }

    @GetMapping("/calculate-adjustment")
    @Operation(summary = "Calculate adjustment factor", description = "Calculates the adjustment factor between two dates for a specific index")
    @ApiResponse(responseCode = "200", description = "Successfully calculated adjustment factor")
    public ResponseEntity<Map<String, Object>> calculateAdjustment(
            @RequestParam String country,
            @RequestParam IndexType type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        BigDecimal factor = indexValueService.calculateAdjustmentFactor(country.toUpperCase(), type, from, to);

        return ResponseEntity.ok(Map.of(
            "country", country.toUpperCase(),
            "indexType", type,
            "fromDate", from,
            "toDate", to,
            "factor", factor
        ));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh all indices", description = "Manually triggers a refresh of all index values from external sources")
    @ApiResponse(responseCode = "200", description = "Refresh triggered successfully")
    public ResponseEntity<Map<String, String>> refreshAllIndices() {
        indexValueService.refreshAllIndices();
        return ResponseEntity.ok(Map.of("status", "Refresh completed"));
    }

    @PostMapping("/refresh/{countryCode}")
    @Operation(summary = "Refresh indices for country", description = "Manually triggers a refresh of index values for a specific country")
    @ApiResponse(responseCode = "200", description = "Refresh triggered successfully")
    public ResponseEntity<Map<String, String>> refreshIndicesForCountry(@PathVariable String countryCode) {
        indexValueService.refreshIndicesForCountry(countryCode.toUpperCase());
        return ResponseEntity.ok(Map.of("status", "Refresh completed for " + countryCode.toUpperCase()));
    }

    @PostMapping("/import-historical")
    @Operation(summary = "Import all historical data", description = "Imports all historical index values from external sources (one-time use)")
    @ApiResponse(responseCode = "200", description = "Import completed successfully")
    public ResponseEntity<Map<String, String>> importHistoricalData() {
        indexValueService.importAllHistoricalData();
        return ResponseEntity.ok(Map.of("status", "Historical data import completed"));
    }

    @GetMapping("/{countryCode}/{type}/annual-change")
    @Operation(summary = "Get annual percentage change", description = "Returns the annual percentage change for an index (like ARquiler displays)")
    @ApiResponse(responseCode = "200", description = "Successfully calculated annual change")
    public ResponseEntity<Map<String, Object>> getAnnualChange(
            @PathVariable String countryCode,
            @PathVariable IndexType type) {

        BigDecimal annualChange = indexValueService.calculateAnnualPercentageChange(countryCode.toUpperCase(), type);

        return ResponseEntity.ok(Map.of(
            "country", countryCode.toUpperCase(),
            "indexType", type,
            "annualChangePercent", annualChange
        ));
    }

    @GetMapping("/{countryCode}/all/annual-changes")
    @Operation(summary = "Get all annual percentage changes", description = "Returns the annual percentage changes for all indices in a country")
    @ApiResponse(responseCode = "200", description = "Successfully calculated all annual changes")
    public ResponseEntity<List<Map<String, Object>>> getAllAnnualChanges(@PathVariable String countryCode) {
        List<Map<String, Object>> results = List.of(
            Map.of("indexType", IndexType.ICL, "annualChangePercent", indexValueService.calculateAnnualPercentageChange(countryCode, IndexType.ICL)),
            Map.of("indexType", IndexType.IPC, "annualChangePercent", indexValueService.calculateAnnualPercentageChange(countryCode, IndexType.IPC)),
            Map.of("indexType", IndexType.DOLAR_OFICIAL, "annualChangePercent", indexValueService.calculateAnnualPercentageChange(countryCode, IndexType.DOLAR_OFICIAL)),
            Map.of("indexType", IndexType.DOLAR_BLUE, "annualChangePercent", indexValueService.calculateAnnualPercentageChange(countryCode, IndexType.DOLAR_BLUE)),
            Map.of("indexType", IndexType.DOLAR_MEP, "annualChangePercent", indexValueService.calculateAnnualPercentageChange(countryCode, IndexType.DOLAR_MEP))
        );

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{countryCode}/{type}/monthly-change")
    @Operation(summary = "Get monthly percentage change", description = "Returns the monthly percentage change for an index")
    @ApiResponse(responseCode = "200", description = "Successfully calculated monthly change")
    public ResponseEntity<Map<String, Object>> getMonthlyChange(
            @PathVariable String countryCode,
            @PathVariable IndexType type) {

        BigDecimal monthlyChange = indexValueService.calculateMonthlyPercentageChange(countryCode.toUpperCase(), type);

        return ResponseEntity.ok(Map.of(
            "country", countryCode.toUpperCase(),
            "indexType", type,
            "monthlyChangePercent", monthlyChange
        ));
    }

    @GetMapping("/{countryCode}/all/monthly-changes")
    @Operation(summary = "Get all monthly percentage changes", description = "Returns the monthly percentage changes for all indices in a country")
    @ApiResponse(responseCode = "200", description = "Successfully calculated all monthly changes")
    public ResponseEntity<List<Map<String, Object>>> getAllMonthlyChanges(@PathVariable String countryCode) {
        List<Map<String, Object>> results = List.of(
            Map.of("indexType", IndexType.ICL, "monthlyChangePercent", indexValueService.calculateMonthlyPercentageChange(countryCode, IndexType.ICL)),
            Map.of("indexType", IndexType.IPC, "monthlyChangePercent", indexValueService.calculateMonthlyPercentageChange(countryCode, IndexType.IPC)),
            Map.of("indexType", IndexType.DOLAR_OFICIAL, "monthlyChangePercent", indexValueService.calculateMonthlyPercentageChange(countryCode, IndexType.DOLAR_OFICIAL)),
            Map.of("indexType", IndexType.DOLAR_BLUE, "monthlyChangePercent", indexValueService.calculateMonthlyPercentageChange(countryCode, IndexType.DOLAR_BLUE)),
            Map.of("indexType", IndexType.DOLAR_MEP, "monthlyChangePercent", indexValueService.calculateMonthlyPercentageChange(countryCode, IndexType.DOLAR_MEP))
        );

        return ResponseEntity.ok(results);
    }

    private IndexValueDto toDto(IndexValue entity) {
        return IndexValueDto.builder()
            .id(entity.getId())
            .indexType(entity.getIndexType())
            .countryCode(entity.getCountryCode())
            .valueDate(entity.getValueDate())
            .value(entity.getValue())
            .source(entity.getSource())
            .build();
    }
}
