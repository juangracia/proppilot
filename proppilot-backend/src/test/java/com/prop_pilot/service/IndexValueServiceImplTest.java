package com.prop_pilot.service;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.repository.IndexValueRepository;
import com.prop_pilot.service.impl.IndexValueServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IndexValueServiceImplTest {

    @Mock private IndexValueRepository repository;
    @InjectMocks private IndexValueServiceImpl service;

    @Test
    void findLatestOnOrBefore_returnsRepositoryHit() {
        IndexValue iv = new IndexValue();
        iv.setIndexType("ICL");
        iv.setCountryCode("AR");
        iv.setValueDate(LocalDate.of(2026, 3, 1));
        iv.setValue(new BigDecimal("1.5224"));

        when(repository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("ICL"), eq("AR"), any(LocalDate.class)))
            .thenReturn(Optional.of(iv));

        Optional<IndexValue> result = service.findLatestOnOrBefore(AdjustmentIndex.ICL, "AR", LocalDate.of(2026, 4, 23));

        assertThat(result).isPresent();
        assertThat(result.get().getValue()).isEqualByComparingTo("1.5224");
        assertThat(result.get().getValueDate()).isEqualTo(LocalDate.of(2026, 3, 1));
    }

    @Test
    void findLatestOnOrBefore_returnsEmptyWhenNoData() {
        when(repository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                any(), any(), any()))
            .thenReturn(Optional.empty());

        Optional<IndexValue> result = service.findLatestOnOrBefore(AdjustmentIndex.IPC, "AR", LocalDate.of(2026, 4, 23));

        assertThat(result).isEmpty();
    }

    @Test
    void findLatestOnOrBefore_usesEnumNameAsIndexType() {
        when(repository.findTopByIndexTypeAndCountryCodeAndValueDateLessThanEqualOrderByValueDateDesc(
                eq("IPC"), eq("AR"), any()))
            .thenReturn(Optional.empty());

        service.findLatestOnOrBefore(AdjustmentIndex.IPC, "AR", LocalDate.of(2026, 4, 23));
    }
}
