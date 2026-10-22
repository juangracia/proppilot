package com.prop_pilot.service;

import com.prop_pilot.dto.country.CountryInfoDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CountryConfigService {

    private static final Map<String, CountryInfoDto> COUNTRY_CONFIG = Map.of(
        "AR", CountryInfoDto.builder()
            .code("AR")
            .name("Argentina")
            .currency("ARS")
            .build(),
        "US", CountryInfoDto.builder()
            .code("US")
            .name("United States")
            .currency("USD")
            .build(),
        "ES", CountryInfoDto.builder()
            .code("ES")
            .name("Spain")
            .currency("EUR")
            .build(),
        "MX", CountryInfoDto.builder()
            .code("MX")
            .name("Mexico")
            .currency("MXN")
            .build(),
        "CL", CountryInfoDto.builder()
            .code("CL")
            .name("Chile")
            .currency("CLP")
            .build(),
        "CO", CountryInfoDto.builder()
            .code("CO")
            .name("Colombia")
            .currency("COP")
            .build(),
        "UY", CountryInfoDto.builder()
            .code("UY")
            .name("Uruguay")
            .currency("UYU")
            .build(),
        "BR", CountryInfoDto.builder()
            .code("BR")
            .name("Brazil")
            .currency("BRL")
            .build(),
        "PE", CountryInfoDto.builder()
            .code("PE")
            .name("Peru")
            .currency("PEN")
            .build()
    );

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
}
