package com.prop_pilot.service.impl;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.CountryConfigService;
import com.prop_pilot.service.IndexValueService;
import com.prop_pilot.service.external.ExternalIndexFetcher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class IndexValueServiceImpl implements IndexValueService {

    private final IndexValueRepository indexValueRepository;
    private final CountryConfigService countryConfigService;
    private final List<ExternalIndexFetcher> fetchers;

    public IndexValueServiceImpl(IndexValueRepository indexValueRepository,
                                 CountryConfigService countryConfigService,
                                 List<ExternalIndexFetcher> fetchers) {
        this.indexValueRepository = indexValueRepository;
        this.countryConfigService = countryConfigService;
        this.fetchers = fetchers;
    }

    @Override
    public Optional<IndexValue> getLatestValue(String countryCode, IndexType indexType) {
        return indexValueRepository.findFirstByIndexTypeAndCountryCodeOrderByValueDateDesc(indexType, countryCode);
    }

    @Override
    public Optional<IndexValue> getValueForDate(String countryCode, IndexType indexType, LocalDate date) {
        return indexValueRepository.findByIndexTypeAndCountryCodeAndValueDate(indexType, countryCode, date);
    }

    @Override
    public Optional<IndexValue> getClosestValue(String countryCode, IndexType indexType, LocalDate date) {
        return indexValueRepository.findClosestValue(indexType, countryCode, date);
    }

    @Override
    public List<IndexValue> getHistory(String countryCode, IndexType indexType, LocalDate from, LocalDate to) {
        return indexValueRepository.findByIndexTypeAndCountryCodeAndValueDateBetweenOrderByValueDateDesc(
            indexType, countryCode, from, to);
    }

    @Override
    public List<IndexValue> getAllLatestValues(String countryCode) {
        return indexValueRepository.findLatestValuesByCountry(countryCode);
    }

    @Override
    public BigDecimal calculateAdjustmentFactor(String countryCode, IndexType indexType,
                                                 LocalDate fromDate, LocalDate toDate) {
        if (indexType == IndexType.NONE) {
            return BigDecimal.ONE;
        }

        Optional<IndexValue> fromValue = getClosestValue(countryCode, indexType, fromDate);
        Optional<IndexValue> toValue = getClosestValue(countryCode, indexType, toDate);

        if (fromValue.isEmpty() || toValue.isEmpty()) {
            log.warn("Cannot calculate adjustment factor: missing index values for {} from {} to {}",
                indexType, fromDate, toDate);
            return BigDecimal.ONE;
        }

        BigDecimal from = fromValue.get().getValue();
        BigDecimal to = toValue.get().getValue();

        if (from.compareTo(BigDecimal.ZERO) == 0) {
            log.warn("Cannot calculate adjustment factor: fromValue is zero for {}", indexType);
            return BigDecimal.ONE;
        }

        return to.divide(from, 6, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public void refreshAllIndices() {
        log.info("Starting refresh of all indices...");

        List<String> countriesWithIndices = countryConfigService.getCountriesWithIndices();
        for (String countryCode : countriesWithIndices) {
            refreshIndicesForCountry(countryCode);
        }

        log.info("Finished refreshing all indices");
    }

    @Override
    @Transactional
    public void refreshIndicesForCountry(String countryCode) {
        log.info("Refreshing indices for country: {}", countryCode);

        for (ExternalIndexFetcher fetcher : fetchers) {
            if (!fetcher.getCountryCode().equals(countryCode)) {
                continue;
            }

            try {
                List<IndexValue> values = fetcher.fetchLatestValues();
                for (IndexValue value : values) {
                    saveIndexValueIfNew(value);
                }
                log.info("Fetched {} values from {}", values.size(), fetcher.getClass().getSimpleName());
            } catch (Exception e) {
                log.error("Error fetching from {}: {}", fetcher.getClass().getSimpleName(), e.getMessage(), e);
            }
        }
    }

    @Override
    @Transactional
    public IndexValue saveIndexValue(IndexValue indexValue) {
        return indexValueRepository.save(indexValue);
    }

    private void saveIndexValueIfNew(IndexValue indexValue) {
        boolean exists = indexValueRepository.existsByIndexTypeAndCountryCodeAndValueDate(
            indexValue.getIndexType(),
            indexValue.getCountryCode(),
            indexValue.getValueDate()
        );

        if (!exists) {
            indexValueRepository.save(indexValue);
            log.debug("Saved new index value: {} = {} for {} on {}",
                indexValue.getIndexType(), indexValue.getValue(),
                indexValue.getCountryCode(), indexValue.getValueDate());
        } else {
            log.trace("Index value already exists: {} for {} on {}",
                indexValue.getIndexType(), indexValue.getCountryCode(), indexValue.getValueDate());
        }
    }
}
