package com.prop_pilot.repository;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.IndexValue.IndexType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IndexValueRepository extends JpaRepository<IndexValue, Long> {

    Optional<IndexValue> findFirstByIndexTypeAndCountryCodeOrderByValueDateDesc(
        IndexType indexType, String countryCode);

    Optional<IndexValue> findByIndexTypeAndCountryCodeAndValueDate(
        IndexType indexType, String countryCode, LocalDate valueDate);

    @Query("SELECT i FROM IndexValue i WHERE i.indexType = :type AND i.countryCode = :country " +
           "AND i.valueDate <= :date ORDER BY i.valueDate DESC LIMIT 1")
    Optional<IndexValue> findClosestValue(
        @Param("type") IndexType type,
        @Param("country") String country,
        @Param("date") LocalDate date);

    List<IndexValue> findByIndexTypeAndCountryCodeAndValueDateBetweenOrderByValueDateDesc(
        IndexType indexType, String countryCode, LocalDate from, LocalDate to);

    boolean existsByIndexTypeAndCountryCodeAndValueDate(
        IndexType indexType, String countryCode, LocalDate valueDate);

    @Query("SELECT MAX(i.valueDate) FROM IndexValue i WHERE i.indexType = :type AND i.countryCode = :country")
    Optional<LocalDate> findLatestDateByIndexTypeAndCountry(
        @Param("type") IndexType type,
        @Param("country") String country);

    @Query("SELECT DISTINCT i.countryCode FROM IndexValue i")
    List<String> findDistinctCountryCodes();

    List<IndexValue> findByCountryCodeOrderByValueDateDesc(String countryCode);

    @Query("SELECT i FROM IndexValue i WHERE i.countryCode = :country " +
           "AND i.valueDate = (SELECT MAX(i2.valueDate) FROM IndexValue i2 " +
           "WHERE i2.indexType = i.indexType AND i2.countryCode = :country)")
    List<IndexValue> findLatestValuesByCountry(@Param("country") String country);
}
