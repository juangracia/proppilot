package com.prop_pilot.service;

import com.prop_pilot.dto.country.CountryInfoDto;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.prop_pilot.entity.Lease.AdjustmentIndex.*;

@Service
public class CountryConfigService {

    private static final Map<String, CountryInfoDto> COUNTRY_CONFIG = Map.of(
        "AR", CountryInfoDto.builder()
            .code("AR")
            .name("Argentina")
            .currency("ARS")
            .hasIndices(true)
            .availableIndices(List.of(ICL, IPC, DOLAR_BLUE, DOLAR_MEP, DOLAR_OFICIAL, NONE))
            .build(),
        "US", CountryInfoDto.builder()
            .code("US")
            .name("United States")
            .currency("USD")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "ES", CountryInfoDto.builder()
            .code("ES")
            .name("Spain")
            .currency("EUR")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "MX", CountryInfoDto.builder()
            .code("MX")
            .name("Mexico")
            .currency("MXN")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "CL", CountryInfoDto.builder()
            .code("CL")
            .name("Chile")
            .currency("CLP")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "CO", CountryInfoDto.builder()
            .code("CO")
            .name("Colombia")
            .currency("COP")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "UY", CountryInfoDto.builder()
            .code("UY")
            .name("Uruguay")
            .currency("UYU")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "BR", CountryInfoDto.builder()
            .code("BR")
            .name("Brazil")
            .currency("BRL")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build(),
        "PE", CountryInfoDto.builder()
            .code("PE")
            .name("Peru")
            .currency("PEN")
            .hasIndices(false)
            .availableIndices(List.of(NONE))
            .build()
    );

    public List<AdjustmentIndex> getAvailableIndices(String countryCode) {
        CountryInfoDto config = COUNTRY_CONFIG.get(countryCode);
        if (config != null) {
            return config.getAvailableIndices();
        }
        return List.of(NONE);
    }

    public boolean isValidIndexForCountry(AdjustmentIndex index, String countryCode) {
        return getAvailableIndices(countryCode).contains(index);
    }

    public List<CountryInfoDto> getSupportedCountries() {
        return COUNTRY_CONFIG.values().stream()
            .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
            .toList();
    }

    public Optional<CountryInfoDto> getCountryInfo(String countryCode) {
        return Optional.ofNullable(COUNTRY_CONFIG.get(countryCode));
    }

    public boolean isCountrySupported(String countryCode) {
        return COUNTRY_CONFIG.containsKey(countryCode);
    }

    public List<String> getCountriesWithIndices() {
        return COUNTRY_CONFIG.values().stream()
            .filter(CountryInfoDto::isHasIndices)
            .map(CountryInfoDto::getCode)
            .toList();
    }
}
