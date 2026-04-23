package com.prop_pilot.repository;

import com.prop_pilot.entity.IndexValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface IndexValueRepository extends JpaRepository<IndexValue, Long> {

    Optional<IndexValue> findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
        String indexType,
        String countryCode,
        LocalDate valueDate
    );
}
