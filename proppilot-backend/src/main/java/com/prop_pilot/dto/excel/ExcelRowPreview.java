package com.prop_pilot.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcelRowPreview<T> {
    private int rowNumber;
    private T data;
    private ImportAction action;
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    private boolean valid;

    public enum ImportAction {
        CREATE,
        SKIP,    // Already exists
        ERROR    // Validation failed
    }
}
