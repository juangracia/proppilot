package com.mirent.service.impl;

import com.mirent.entity.Payment;
import com.mirent.entity.PropertyUnit;
import com.mirent.exception.ResourceNotFoundException;
import com.mirent.exception.BusinessLogicException;
import com.mirent.repository.PaymentRepository;
import com.mirent.repository.PropertyUnitRepository;
import com.mirent.service.PaymentService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PropertyUnitRepository propertyUnitRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository, PropertyUnitRepository propertyUnitRepository) {
        this.paymentRepository = paymentRepository;
        this.propertyUnitRepository = propertyUnitRepository;
    }

    @Override
    public Payment createPayment(@NonNull Payment payment, @NonNull Long ownerId) {
        // Validate property unit exists and belongs to the owner
        if (payment.getPropertyUnit() != null && payment.getPropertyUnit().getId() != null) {
            Long propertyUnitId = payment.getPropertyUnit().getId();
            PropertyUnit propertyUnit = propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));
            payment.setPropertyUnit(propertyUnit);
        }

        // Business rule: Payment amount should not exceed 3 months of rent for a single payment
        if (payment.getPropertyUnit() != null && payment.getAmount() != null) {
            BigDecimal maxPayment = payment.getPropertyUnit().getBaseRentAmount().multiply(new BigDecimal("3"));
            if (payment.getAmount().compareTo(maxPayment) > 0) {
                throw new BusinessLogicException("Payment amount cannot exceed 3 months of rent in a single payment");
            }
        }

        return paymentRepository.save(payment);
    }

    @Override
    public Payment getPaymentById(@NonNull Long id, @NonNull Long ownerId) {
        return paymentRepository.findByIdAndPropertyOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    @Override
    public List<Payment> getAllPayments(@NonNull Long ownerId) {
        return paymentRepository.findByPropertyOwnerId(ownerId);
    }

    @Override
    public List<Payment> getPaymentsByPropertyUnit(Long propertyUnitId, @NonNull Long ownerId) {
        return paymentRepository.findByPropertyUnitIdAndOwnerId(propertyUnitId, ownerId);
    }

    @Override
    public Payment updatePayment(@NonNull Long id, Payment payment, @NonNull Long ownerId) {
        Payment existingPayment = getPaymentById(id, ownerId);
        existingPayment.setAmount(payment.getAmount());
        existingPayment.setPaymentDate(payment.getPaymentDate());
        existingPayment.setPaymentType(payment.getPaymentType());
        existingPayment.setDescription(payment.getDescription());
        existingPayment.setStatus(payment.getStatus());
        return paymentRepository.save(existingPayment);
    }

    @Override
    public void deletePayment(@NonNull Long id, @NonNull Long ownerId) {
        Payment payment = getPaymentById(id, ownerId);
        paymentRepository.delete(payment);
    }

    @Override
    public BigDecimal calculateAdjustedRent(@NonNull Long propertyUnitId, LocalDate effectiveDate, @NonNull Long ownerId) {
        PropertyUnit propertyUnit = propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        BigDecimal baseRent = propertyUnit.getBaseRentAmount();
        LocalDate leaseStartDate = propertyUnit.getLeaseStartDate();

        if (leaseStartDate == null || effectiveDate.isBefore(leaseStartDate)) {
            return baseRent;
        }

        // Calculate years since lease start
        long yearsSinceStart = ChronoUnit.YEARS.between(leaseStartDate, effectiveDate);

        // Apply 3% annual increase
        BigDecimal adjustmentRate = new BigDecimal("0.03");
        BigDecimal adjustmentFactor = BigDecimal.ONE.add(adjustmentRate).pow((int) yearsSinceStart);

        return baseRent.multiply(adjustmentFactor).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public List<Payment> getOutstandingPayments(Long propertyUnitId, @NonNull Long ownerId) {
        return paymentRepository.findByPropertyUnitIdAndStatusAndOwnerId(propertyUnitId, Payment.PaymentStatus.PENDING, ownerId);
    }

    @Override
    public BigDecimal getTotalPaidAmount(Long propertyUnitId, Payment.PaymentType paymentType, @NonNull Long ownerId) {
        // Verify property belongs to owner first
        propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        BigDecimal total = paymentRepository.sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, paymentType);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<Payment> getPaymentHistory(Long propertyUnitId, LocalDate startDate, LocalDate endDate, @NonNull Long ownerId) {
        // Verify property belongs to owner first
        propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        return paymentRepository.findByPropertyUnitIdAndPaymentDateBetween(propertyUnitId, startDate, endDate);
    }

    @Override
    public BigDecimal calculateOutstandingAmount(@NonNull Long propertyUnitId, LocalDate asOfDate, @NonNull Long ownerId) {
        PropertyUnit propertyUnit = propertyUnitRepository.findByIdAndOwnerId(propertyUnitId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + propertyUnitId));

        // Calculate expected rent from lease start to asOfDate
        LocalDate leaseStartDate = propertyUnit.getLeaseStartDate();
        if (leaseStartDate == null || asOfDate.isBefore(leaseStartDate)) {
            return BigDecimal.ZERO;
        }

        // Calculate total expected rent payments
        long monthsElapsed = ChronoUnit.MONTHS.between(leaseStartDate, asOfDate);
        BigDecimal currentAdjustedRent = calculateAdjustedRent(propertyUnitId, asOfDate, ownerId);

        BigDecimal expectedTotal = currentAdjustedRent.multiply(new BigDecimal(monthsElapsed));

        // Calculate total paid rent
        BigDecimal totalPaidRent = getTotalPaidAmount(propertyUnitId, Payment.PaymentType.RENT, ownerId);

        // Outstanding amount = Expected - Paid
        BigDecimal outstanding = expectedTotal.subtract(totalPaidRent);
        return outstanding.max(BigDecimal.ZERO);
    }
}
