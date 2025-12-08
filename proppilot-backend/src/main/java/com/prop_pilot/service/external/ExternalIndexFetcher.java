package com.prop_pilot.service.external;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;

import java.util.List;

public interface ExternalIndexFetcher {

    List<IndexType> getSupportedIndexTypes();

    String getCountryCode();

    List<IndexValue> fetchLatestValues();

    /**
     * Fetch all historical values from the external source.
     * Used for initial data population.
     */
    default List<IndexValue> fetchAllHistoricalValues() {
        return fetchLatestValues();
    }
}
