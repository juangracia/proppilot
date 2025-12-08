package com.prop_pilot.service;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IndexValueService {

    Optional<IndexValue> getLatestValue(String countryCode, IndexType indexType);

    Optional<IndexValue> getValueForDate(String countryCode, IndexType indexType, LocalDate date);

    Optional<IndexValue> getClosestValue(String countryCode, IndexType indexType, LocalDate date);

    List<IndexValue> getHistory(String countryCode, IndexType indexType, LocalDate from, LocalDate to);

    List<IndexValue> getAllLatestValues(String countryCode);

    BigDecimal calculateAdjustmentFactor(String countryCode, IndexType indexType, LocalDate fromDate, LocalDate toDate);

    void refreshAllIndices();

    void refreshIndicesForCountry(String countryCode);

    IndexValue saveIndexValue(IndexValue indexValue);

    /**
     * Import all historical data for all indices.
     * Used for initial data population.
     */
    void importAllHistoricalData();

    /**
     * Calculate the annual percentage change for an index.
     * For ICL: (current / year_ago - 1) * 100
     * For IPC: accumulated inflation over the last 12 months
     */
    BigDecimal calculateAnnualPercentageChange(String countryCode, IndexType indexType);
}
