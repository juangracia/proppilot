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

    @Override
    @Transactional
    public void importAllHistoricalData() {
        log.info("Starting import of all historical index data...");

        for (ExternalIndexFetcher fetcher : fetchers) {
            try {
                List<IndexValue> values = fetcher.fetchAllHistoricalValues();
                int imported = 0;
                for (IndexValue value : values) {
                    boolean exists = indexValueRepository.existsByIndexTypeAndCountryCodeAndValueDate(
                        value.getIndexType(),
                        value.getCountryCode(),
                        value.getValueDate()
                    );
                    if (!exists) {
                        indexValueRepository.save(value);
                        imported++;
                    }
                }
                log.info("Imported {} new values from {} (fetched {} total)",
                    imported, fetcher.getClass().getSimpleName(), values.size());
            } catch (Exception e) {
                log.error("Error importing historical data from {}: {}",
                    fetcher.getClass().getSimpleName(), e.getMessage(), e);
            }
        }

        log.info("Finished importing all historical index data");
    }

    @Override
    public BigDecimal calculateAnnualPercentageChange(String countryCode, IndexType indexType) {
        if (indexType == IndexType.NONE) {
            return BigDecimal.ZERO;
        }

        LocalDate now = LocalDate.now();
        LocalDate oneYearAgo = now.minusYears(1);

        if (indexType == IndexType.IPC) {
            // For IPC, calculate accumulated inflation over last 12 months
            // Formula: ((1 + m1/100) * (1 + m2/100) * ... * (1 + m12/100) - 1) * 100
            List<IndexValue> history = getHistory(countryCode, indexType, oneYearAgo, now);
            if (history.isEmpty()) {
                log.warn("No IPC history found for annual change calculation");
                return BigDecimal.ZERO;
            }

            BigDecimal accumulated = BigDecimal.ONE;
            for (IndexValue value : history) {
                // IPC values are monthly percentage (e.g., 2.3 means 2.3%)
                BigDecimal factor = BigDecimal.ONE.add(
                    value.getValue().divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                );
                accumulated = accumulated.multiply(factor);
            }

            // Convert to percentage: (accumulated - 1) * 100
            return accumulated.subtract(BigDecimal.ONE)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        } else {
            // For ICL, DOLAR_*, CER, UVA etc: (current / year_ago - 1) * 100
            Optional<IndexValue> currentValue = getLatestValue(countryCode, indexType);
            Optional<IndexValue> yearAgoValue = getClosestValue(countryCode, indexType, oneYearAgo);

            if (currentValue.isEmpty() || yearAgoValue.isEmpty()) {
                log.warn("Cannot calculate annual change: missing values for {}", indexType);
                return BigDecimal.ZERO;
            }

            BigDecimal current = currentValue.get().getValue();
            BigDecimal yearAgo = yearAgoValue.get().getValue();

            if (yearAgo.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }

            // (current / yearAgo - 1) * 100
            return current.divide(yearAgo, 6, RoundingMode.HALF_UP)
                .subtract(BigDecimal.ONE)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        }
    }

    @Override
    public BigDecimal calculateMonthlyPercentageChange(String countryCode, IndexType indexType) {
        if (indexType == IndexType.NONE) {
            return BigDecimal.ZERO;
        }

        if (indexType == IndexType.IPC) {
            // For IPC, the stored value IS the monthly percentage change
            Optional<IndexValue> latestValue = getLatestValue(countryCode, indexType);
            if (latestValue.isEmpty()) {
                log.warn("No IPC value found for monthly change");
                return BigDecimal.ZERO;
            }
            return latestValue.get().getValue().setScale(2, RoundingMode.HALF_UP);
        } else {
            // For ICL, DOLAR_*, etc: (current / month_ago - 1) * 100
            LocalDate now = LocalDate.now();
            LocalDate oneMonthAgo = now.minusMonths(1);

            Optional<IndexValue> currentValue = getLatestValue(countryCode, indexType);
            Optional<IndexValue> monthAgoValue = getClosestValue(countryCode, indexType, oneMonthAgo);

            if (currentValue.isEmpty() || monthAgoValue.isEmpty()) {
                log.warn("Cannot calculate monthly change: missing values for {}", indexType);
                return BigDecimal.ZERO;
            }

            BigDecimal current = currentValue.get().getValue();
            BigDecimal monthAgo = monthAgoValue.get().getValue();

            if (monthAgo.compareTo(BigDecimal.ZERO) == 0) {
                return BigDecimal.ZERO;
            }

            // (current / monthAgo - 1) * 100
            return current.divide(monthAgo, 6, RoundingMode.HALF_UP)
                .subtract(BigDecimal.ONE)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        }
    }

    @Override
    public BigDecimal calculateAdjustedRent(BigDecimal baseRent, String countryCode, IndexType indexType,
                                             LocalDate leaseStartDate, LocalDate paymentDate) {
        if (baseRent == null || baseRent.compareTo(BigDecimal.ZERO) <= 0) {
            return baseRent;
        }

        if (indexType == null || indexType == IndexType.NONE) {
            return baseRent;
        }

        BigDecimal adjustmentFactor = calculateAdjustmentFactor(countryCode, indexType, leaseStartDate, paymentDate);

        BigDecimal adjustedRent = baseRent.multiply(adjustmentFactor).setScale(2, RoundingMode.HALF_UP);
        log.info("Calculated adjusted rent: base={}, factor={}, adjusted={} (index={}, from={}, to={})",
            baseRent, adjustmentFactor, adjustedRent, indexType, leaseStartDate, paymentDate);

        return adjustedRent;
    }
}
