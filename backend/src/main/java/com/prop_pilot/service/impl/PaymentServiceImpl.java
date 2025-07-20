package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import com.prop_pilot.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PropertyUnitRepository propertyUnitRepository;

    @Override
    public Payment createPayment(Payment payment) {
        // Validate property unit exists
        if (payment.getPropertyUnit() != null && payment.getPropertyUnit().getId() != null) {
            PropertyUnit propertyUnit = propertyUnitRepository.findById(payment.getPropertyUnit().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Property unit not found with id: " + payment.getPropertyUnit().getId()));
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
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    @Override
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @Override
    public List<Payment> getPaymentsByPropertyUnit(Long propertyUnitId) {
        return paymentRepository.findByPropertyUnitId(propertyUnitId);
    }

    @Override
    public Payment updatePayment(Long id, Payment payment) {
        Payment existingPayment = getPaymentById(id);
        existingPayment.setAmount(payment.getAmount());
        existingPayment.setPaymentDate(payment.getPaymentDate());
        existingPayment.setPaymentType(payment.getPaymentType());
        existingPayment.setDescription(payment.getDescription());
        existingPayment.setStatus(payment.getStatus());
        return paymentRepository.save(existingPayment);
    }

    @Override
    public void deletePayment(Long id) {
        Payment payment = getPaymentById(id);
        paymentRepository.delete(payment);
    }

    @Override
    public BigDecimal calculateAdjustedRent(Long propertyUnitId, LocalDate effectiveDate) {
        PropertyUnit propertyUnit = propertyUnitRepository.findById(propertyUnitId)
                .orElseThrow(() -> new RuntimeException("Property unit not found with id: " + propertyUnitId));

        BigDecimal baseRent = propertyUnit.getBaseRentAmount();
        LocalDate leaseStartDate = propertyUnit.getLeaseStartDate();

        if (leaseStartDate == null || effectiveDate.isBefore(leaseStartDate)) {
            return baseRent;
        }

        // Calculate years since lease start
        long yearsSinceStart = ChronoUnit.YEARS.between(leaseStartDate, effectiveDate);

        // Apply 3% annual increase (this is a simple example - in real scenarios this might be more complex)
        BigDecimal adjustmentRate = new BigDecimal("0.03"); // 3% per year
        BigDecimal adjustmentFactor = BigDecimal.ONE.add(adjustmentRate).pow((int) yearsSinceStart);
        
        return baseRent.multiply(adjustmentFactor).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public List<Payment> getOutstandingPayments(Long propertyUnitId) {
        return paymentRepository.findByPropertyUnitIdAndStatus(propertyUnitId, Payment.PaymentStatus.PENDING);
    }

    @Override
    public BigDecimal getTotalPaidAmount(Long propertyUnitId, Payment.PaymentType paymentType) {
        BigDecimal total = paymentRepository.sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, paymentType);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public List<Payment> getPaymentHistory(Long propertyUnitId, LocalDate startDate, LocalDate endDate) {
        return paymentRepository.findByPropertyUnitIdAndPaymentDateBetween(propertyUnitId, startDate, endDate);
    }

    @Override
    public BigDecimal calculateOutstandingAmount(Long propertyUnitId, LocalDate asOfDate) {
        PropertyUnit propertyUnit = propertyUnitRepository.findById(propertyUnitId)
                .orElseThrow(() -> new RuntimeException("Property unit not found with id: " + propertyUnitId));

        // Calculate expected rent from lease start to asOfDate
        LocalDate leaseStartDate = propertyUnit.getLeaseStartDate();
        if (leaseStartDate == null || asOfDate.isBefore(leaseStartDate)) {
            return BigDecimal.ZERO;
        }

        // Calculate total expected rent payments
        long monthsElapsed = ChronoUnit.MONTHS.between(leaseStartDate, asOfDate);
        BigDecimal currentAdjustedRent = calculateAdjustedRent(propertyUnitId, asOfDate);
        
        // For simplicity, we'll use current adjusted rent for all months
        // In a real system, you'd calculate month-by-month with proper adjustments
        BigDecimal expectedTotal = currentAdjustedRent.multiply(new BigDecimal(monthsElapsed));

        // Calculate total paid rent
        BigDecimal totalPaidRent = getTotalPaidAmount(propertyUnitId, Payment.PaymentType.RENT);

        // Outstanding amount = Expected - Paid
        BigDecimal outstanding = expectedTotal.subtract(totalPaidRent);
        return outstanding.max(BigDecimal.ZERO); // Don't return negative amounts
    }
}
