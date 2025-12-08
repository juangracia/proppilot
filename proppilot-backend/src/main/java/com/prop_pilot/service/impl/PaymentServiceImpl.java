package com.prop_pilot.service.impl;

import com.prop_pilot.entity.IndexValue;
import com.prop_pilot.entity.Lease;
import com.prop_pilot.entity.Lease.AdjustmentIndex;
import com.prop_pilot.entity.Payment;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.LeaseRepository;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.service.IndexValueService;
import com.prop_pilot.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final LeaseRepository leaseRepository;
    private final IndexValueService indexValueService;

    private static final Map<AdjustmentIndex, IndexValue.IndexType> ADJUSTMENT_TO_INDEX_TYPE = Map.of(
        AdjustmentIndex.ICL, IndexValue.IndexType.ICL,
        AdjustmentIndex.IPC, IndexValue.IndexType.IPC,
        AdjustmentIndex.DOLAR_BLUE, IndexValue.IndexType.DOLAR_BLUE,
        AdjustmentIndex.DOLAR_OFICIAL, IndexValue.IndexType.DOLAR_OFICIAL,
        AdjustmentIndex.DOLAR_MEP, IndexValue.IndexType.DOLAR_MEP
    );

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              LeaseRepository leaseRepository,
                              IndexValueService indexValueService) {
        this.paymentRepository = paymentRepository;
        this.leaseRepository = leaseRepository;
        this.indexValueService = indexValueService;
    }

    @Override
    @Transactional
    public Payment createPayment(@NonNull Payment payment, @NonNull Long ownerId) {
        // Get lease ID from transient field or nested object
        Long leaseIdValue = payment.getInputLeaseId();
        if (leaseIdValue == null && payment.getLease() != null) {
            leaseIdValue = payment.getLease().getId();
        }

        if (leaseIdValue == null) {
            throw new BusinessLogicException("Lease is required for payment. All payments must be associated with a lease contract.");
        }

        final Long leaseId = leaseIdValue;

        // Validate lease exists and belongs to owner
        Lease lease = leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + leaseId));

        // Validate payment date is within lease period
        if (payment.getPaymentDate() != null) {
            if (payment.getPaymentDate().isBefore(lease.getStartDate())) {
                throw new BusinessLogicException("Payment date cannot be before lease start date");
            }
        }

        // Business rule: Payment amount should not exceed 3 months of rent for a single payment
        if (payment.getAmount() != null) {
            BigDecimal maxPayment = lease.getMonthlyRent().multiply(new BigDecimal("3"));
            if (payment.getAmount().compareTo(maxPayment) > 0) {
                throw new BusinessLogicException("Payment amount cannot exceed 3 months of rent in a single payment");
            }
        }

        payment.setLease(lease);
        payment.setOwner(lease.getOwner());

        // Track index value at payment time
        trackIndexValueForPayment(payment, lease);

        return paymentRepository.save(payment);
    }

    private void trackIndexValueForPayment(Payment payment, Lease lease) {
        AdjustmentIndex adjustmentIndex = lease.getAdjustmentIndex();
        if (adjustmentIndex == null || adjustmentIndex == AdjustmentIndex.NONE) {
            return;
        }

        IndexValue.IndexType indexType = ADJUSTMENT_TO_INDEX_TYPE.get(adjustmentIndex);
        if (indexType == null) {
            log.warn("No mapping found for adjustment index: {}", adjustmentIndex);
            return;
        }

        String countryCode = lease.getCountryCode() != null ? lease.getCountryCode() : "AR";

        Optional<IndexValue> latestValue = indexValueService.getLatestValue(countryCode, indexType);
        if (latestValue.isPresent()) {
            IndexValue indexValue = latestValue.get();
            payment.setIndexType(indexType.name());
            payment.setIndexValueAtPayment(indexValue.getValue());
            payment.setIndexDate(indexValue.getValueDate());
            log.info("Tracked index value for payment: {} = {} (date: {})",
                indexType, indexValue.getValue(), indexValue.getValueDate());
        } else {
            log.warn("No index value found for {} in country {}", indexType, countryCode);
        }
    }

    @Override
    public Payment getPaymentById(@NonNull Long id, @NonNull Long ownerId) {
        return paymentRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    @Override
    public List<Payment> getAllPayments(@NonNull Long ownerId) {
        return paymentRepository.findByOwnerId(ownerId);
    }

    @Override
    public List<Payment> getPaymentsByLease(@NonNull Long leaseId, @NonNull Long ownerId) {
        // Verify lease belongs to owner
        leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + leaseId));

        return paymentRepository.findByLeaseIdAndOwnerId(leaseId, ownerId);
    }

    @Override
    public List<Payment> getPaymentsByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId) {
        return paymentRepository.findByPropertyUnitIdAndOwnerId(propertyUnitId, ownerId);
    }

    @Override
    public List<Payment> getPaymentsByTenant(@NonNull Long tenantId, @NonNull Long ownerId) {
        return paymentRepository.findByTenantIdAndOwnerId(tenantId, ownerId);
    }

    @Override
    @Transactional
    public Payment updatePayment(@NonNull Long id, @NonNull Payment payment, @NonNull Long ownerId) {
        Payment existingPayment = getPaymentById(id, ownerId);

        if (payment.getAmount() != null) {
            existingPayment.setAmount(payment.getAmount());
        }
        if (payment.getPaymentDate() != null) {
            existingPayment.setPaymentDate(payment.getPaymentDate());
        }
        if (payment.getPaymentType() != null) {
            existingPayment.setPaymentType(payment.getPaymentType());
        }
        if (payment.getDescription() != null) {
            existingPayment.setDescription(payment.getDescription());
        }
        if (payment.getStatus() != null) {
            existingPayment.setStatus(payment.getStatus());
        }

        return paymentRepository.save(existingPayment);
    }

    @Override
    @Transactional
    public void deletePayment(@NonNull Long id, @NonNull Long ownerId) {
        Payment payment = getPaymentById(id, ownerId);
        paymentRepository.delete(payment);
    }

    @Override
    public BigDecimal getTotalPaidAmountByLease(@NonNull Long leaseId, Payment.PaymentType paymentType, @NonNull Long ownerId) {
        // Verify lease belongs to owner
        leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + leaseId));

        BigDecimal total = paymentRepository.sumAmountByLeaseIdAndPaymentTypeAndOwnerId(leaseId, paymentType, ownerId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<Payment> getOutstandingPaymentsByLease(@NonNull Long leaseId, @NonNull Long ownerId) {
        return paymentRepository.findByLeaseIdAndStatusAndOwnerId(leaseId, Payment.PaymentStatus.PENDING, ownerId);
    }

    @Override
    public List<Payment> getPaymentHistory(@NonNull Long leaseId, LocalDate startDate, LocalDate endDate, @NonNull Long ownerId) {
        // Verify lease belongs to owner
        leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + leaseId));

        return paymentRepository.findByLeaseIdAndPaymentDateBetween(leaseId, startDate, endDate);
    }

    @Override
    public BigDecimal calculateOutstandingAmount(@NonNull Long leaseId, LocalDate asOfDate, @NonNull Long ownerId) {
        Lease lease = leaseRepository.findByIdAndOwnerId(leaseId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease not found with id: " + leaseId));

        LocalDate startDate = lease.getStartDate();
        LocalDate effectiveDate = asOfDate != null ? asOfDate : LocalDate.now();

        if (effectiveDate.isBefore(startDate)) {
            return BigDecimal.ZERO;
        }

        // Calculate months elapsed since lease start
        long monthsElapsed = ChronoUnit.MONTHS.between(startDate, effectiveDate) + 1;

        // Expected total = monthly rent * months elapsed
        BigDecimal expectedTotal = lease.getMonthlyRent().multiply(BigDecimal.valueOf(monthsElapsed));

        // Get total paid rent
        BigDecimal totalPaidRent = getTotalPaidAmountByLease(leaseId, Payment.PaymentType.RENT, ownerId);

        // Outstanding = Expected - Paid
        BigDecimal outstanding = expectedTotal.subtract(totalPaidRent);
        return outstanding.max(BigDecimal.ZERO);
    }
}
