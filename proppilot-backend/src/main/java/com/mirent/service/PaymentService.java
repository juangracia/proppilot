package com.mirent.service;

import com.mirent.entity.Payment;
import org.springframework.lang.NonNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    Payment createPayment(@NonNull Payment payment, @NonNull Long ownerId);
    Payment getPaymentById(@NonNull Long id, @NonNull Long ownerId);
    List<Payment> getAllPayments(@NonNull Long ownerId);
    List<Payment> getPaymentsByPropertyUnit(Long propertyUnitId, @NonNull Long ownerId);
    Payment updatePayment(@NonNull Long id, Payment payment, @NonNull Long ownerId);
    void deletePayment(@NonNull Long id, @NonNull Long ownerId);

    // Advanced functionality for rent calculations
    BigDecimal calculateAdjustedRent(@NonNull Long propertyUnitId, LocalDate effectiveDate, @NonNull Long ownerId);
    List<Payment> getOutstandingPayments(Long propertyUnitId, @NonNull Long ownerId);
    BigDecimal getTotalPaidAmount(Long propertyUnitId, Payment.PaymentType paymentType, @NonNull Long ownerId);
    List<Payment> getPaymentHistory(Long propertyUnitId, LocalDate startDate, LocalDate endDate, @NonNull Long ownerId);
    BigDecimal calculateOutstandingAmount(@NonNull Long propertyUnitId, LocalDate asOfDate, @NonNull Long ownerId);
}
