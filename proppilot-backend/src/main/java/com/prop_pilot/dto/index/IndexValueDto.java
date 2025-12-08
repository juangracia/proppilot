package com.prop_pilot.dto.index;

import com.prop_pilot.entity.IndexValue.IndexType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndexValueDto {
    private Long id;
    private IndexType indexType;
    private String countryCode;
    private LocalDate valueDate;
    private BigDecimal value;
    private String source;
}
