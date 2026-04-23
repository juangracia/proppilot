package com.prop_pilot.service.impl;

import com.prop_pilot.dto.AdjustedRentResponse;
import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.service.IndexValueService;
import com.prop_pilot.service.RentAdjustmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class RentAdjustmentServiceImpl implements RentAdjustmentService {

    private static final Set<AdjustmentIndex> SUPPORTED =
        EnumSet.of(AdjustmentIndex.ICL, AdjustmentIndex.IPC);

    private static final int FACTOR_SCALE = 4;
    private static final int AMOUNT_SCALE = 2;
    private static final String DEFAULT_COUNTRY = "AR";

    private final LeaseRepository leaseRepository;
    private final IndexValueService indexValueService;

    public RentAdjustmentServiceImpl(LeaseRepository leaseRepository,
                                     IndexValueService indexValueService) {
        this.leaseRepository = leaseRepository;
        this.indexValueService = indexValueService;
    }

    @Override
    public AdjustedRentResponse computeAdjustedRent(Long leaseId, Long ownerId, LocalDate asOfDate) {
        Lease lease = leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("Lease not found: " + leaseId));

        BigDecimal base = lease.getMonthlyRent();
        AdjustmentIndex idx = lease.getAdjustmentIndex();
        String country = lease.getCountryCode() != null ? lease.getCountryCode() : DEFAULT_COUNTRY;

        if (!SUPPORTED.contains(idx)) {
            if (idx != AdjustmentIndex.NONE) {
                log.warn("Adjustment index {} not yet supported; returning base rent for lease {}", idx, leaseId);
            }
            return noAdjustment(lease, base, idx);
        }

        Optional<IndexValue> startIv = indexValueService.findLatestOnOrBefore(idx, country, lease.getStartDate());
        Optional<IndexValue> currentIv = indexValueService.findLatestOnOrBefore(idx, country, asOfDate);

        if (startIv.isEmpty() || currentIv.isEmpty()) {
            log.warn("Missing index data for lease {} (type={}, start={}, asOf={})",
                leaseId, idx, lease.getStartDate(), asOfDate);
            return noAdjustment(lease, base, idx);
        }

        BigDecimal factor = currentIv.get().getValue()
            .divide(startIv.get().getValue(), FACTOR_SCALE, RoundingMode.HALF_UP);
        BigDecimal adjusted = base.multiply(factor).setScale(AMOUNT_SCALE, RoundingMode.HALF_UP);

        return new AdjustedRentResponse(
            lease.getId(),
            base.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP),
            adjusted,
            factor,
            idx.name(),
            currentIv.get().getValueDate(),
            true
        );
    }

    private AdjustedRentResponse noAdjustment(Lease lease, BigDecimal base, AdjustmentIndex idx) {
        return new AdjustedRentResponse(
            lease.getId(),
            base.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP),
            base.setScale(AMOUNT_SCALE, RoundingMode.HALF_UP),
            BigDecimal.ONE.setScale(FACTOR_SCALE),
            idx.name(),
            null,
            false
        );
    }
}
