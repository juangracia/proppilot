package com.prop_pilot.service;

import com.prop_pilot.entity.Payment;
import org.springframework.lang.NonNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    Payment createPayment(@NonNull Payment payment);
    Payment getPaymentById(@NonNull Long id);
    List<Payment> getAllPayments();
    List<Payment> getPaymentsByPropertyUnit(Long propertyUnitId);
    Payment updatePayment(@NonNull Long id, Payment payment);
    void deletePayment(@NonNull Long id);
    
    // Advanced functionality for rent calculations
    BigDecimal calculateAdjustedRent(@NonNull Long propertyUnitId, LocalDate effectiveDate);
    List<Payment> getOutstandingPayments(Long propertyUnitId);
    BigDecimal getTotalPaidAmount(Long propertyUnitId, Payment.PaymentType paymentType);
    List<Payment> getPaymentHistory(Long propertyUnitId, LocalDate startDate, LocalDate endDate);
    BigDecimal calculateOutstandingAmount(@NonNull Long propertyUnitId, LocalDate asOfDate);
}
