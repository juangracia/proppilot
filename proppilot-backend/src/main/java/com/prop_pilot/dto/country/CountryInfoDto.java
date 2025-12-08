package com.prop_pilot.dto.country;

import com.prop_pilot.entity.Lease.AdjustmentIndex;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountryInfoDto {
    private String code;
    private String name;
    private String currency;
    private boolean hasIndices;
    private List<AdjustmentIndex> availableIndices;
}
