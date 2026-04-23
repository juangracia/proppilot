package com.prop_pilot.service.impl;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.IndexValueService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class IndexValueServiceImpl implements IndexValueService {

    private final IndexValueRepository repository;

    public IndexValueServiceImpl(IndexValueRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<IndexValue> findLatestOnOrBefore(AdjustmentIndex indexType, String countryCode, LocalDate asOfDate) {
        return repository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
            indexType.name(), countryCode, asOfDate);
    }
}
