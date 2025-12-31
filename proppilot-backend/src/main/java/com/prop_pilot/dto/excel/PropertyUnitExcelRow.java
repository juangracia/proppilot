package com.prop_pilot.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyUnitExcelRow {
    private String street;
    private String streetNumber;
    private String floor;
    private String apartment;
    private String city;
    private String province;
    private String postalCode;
    private String type;
    private BigDecimal baseRentAmount;

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (street != null && !street.isBlank()) {
            sb.append(street);
        }
        if (streetNumber != null && !streetNumber.isBlank()) {
            sb.append(" ").append(streetNumber);
        }
        if (floor != null && !floor.isBlank()) {
            sb.append(" ").append(floor);
        }
        if (apartment != null && !apartment.isBlank()) {
            sb.append(apartment);
        }
        if (city != null && !city.isBlank()) {
            sb.append(", ").append(city);
        }
        if (province != null && !province.isBlank()) {
            sb.append(", ").append(province);
        }
        return sb.toString().trim();
    }

    public String getNormalizedAddress() {
        return getFullAddress().toLowerCase().replaceAll("\\s+", " ").trim();
    }
}
