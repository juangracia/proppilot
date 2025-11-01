package com.prop_pilot.service;

import com.prop_pilot.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    Payment createPayment(Payment payment);
    Payment getPaymentById(Long id);
    List<Payment> getAllPayments();
    List<Payment> getPaymentsByPropertyUnit(Long propertyUnitId);
    Payment updatePayment(Long id, Payment payment);
    void deletePayment(Long id);
    
    // Advanced functionality for rent calculations
    BigDecimal calculateAdjustedRent(Long propertyUnitId, LocalDate effectiveDate);
    List<Payment> getOutstandingPayments(Long propertyUnitId);
    BigDecimal getTotalPaidAmount(Long propertyUnitId, Payment.PaymentType paymentType);
    List<Payment> getPaymentHistory(Long propertyUnitId, LocalDate startDate, LocalDate endDate);
    BigDecimal calculateOutstandingAmount(Long propertyUnitId, LocalDate asOfDate);
}
