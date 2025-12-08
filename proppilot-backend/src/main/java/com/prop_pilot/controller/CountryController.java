package com.prop_pilot.controller;

import com.prop_pilot.dto.country.CountryInfoDto;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.service.CountryConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
@Tag(name = "Countries", description = "API for country configuration and available adjustment indices")
public class CountryController {

    private final CountryConfigService countryConfigService;

    public CountryController(CountryConfigService countryConfigService) {
        this.countryConfigService = countryConfigService;
    }

    @GetMapping
    @Operation(summary = "Get all supported countries", description = "Returns a list of all supported countries with their configurations")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all countries")
    public ResponseEntity<List<CountryInfoDto>> getAllCountries() {
        return ResponseEntity.ok(countryConfigService.getSupportedCountries());
    }

    @GetMapping("/{code}")
    @Operation(summary = "Get country by code", description = "Returns country details by ISO 3166-1 alpha-2 code")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Country found"),
        @ApiResponse(responseCode = "404", description = "Country not found")
    })
    public ResponseEntity<CountryInfoDto> getCountryByCode(@PathVariable String code) {
        return countryConfigService.getCountryInfo(code.toUpperCase())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{code}/indices")
    @Operation(summary = "Get available indices for country", description = "Returns the list of available adjustment indices for a specific country")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved available indices"),
        @ApiResponse(responseCode = "404", description = "Country not found")
    })
    public ResponseEntity<List<AdjustmentIndex>> getAvailableIndices(@PathVariable String code) {
        String upperCode = code.toUpperCase();
        if (!countryConfigService.isCountrySupported(upperCode)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(countryConfigService.getAvailableIndices(upperCode));
    }

    @GetMapping("/with-indices")
    @Operation(summary = "Get countries with index support", description = "Returns a list of country codes that have automatic adjustment index support")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved countries with indices")
    public ResponseEntity<List<String>> getCountriesWithIndices() {
        return ResponseEntity.ok(countryConfigService.getCountriesWithIndices());
    }
}
