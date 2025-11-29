package com.prop_pilot.service;

import com.prop_pilot.entity.Payment;
import org.springframework.lang.NonNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {

    Payment createPayment(@NonNull Payment payment, @NonNull Long ownerId);

    Payment getPaymentById(@NonNull Long id, @NonNull Long ownerId);

    List<Payment> getAllPayments(@NonNull Long ownerId);

    List<Payment> getPaymentsByLease(@NonNull Long leaseId, @NonNull Long ownerId);

    List<Payment> getPaymentsByPropertyUnit(@NonNull Long propertyUnitId, @NonNull Long ownerId);

    List<Payment> getPaymentsByTenant(@NonNull Long tenantId, @NonNull Long ownerId);

    Payment updatePayment(@NonNull Long id, @NonNull Payment payment, @NonNull Long ownerId);

    void deletePayment(@NonNull Long id, @NonNull Long ownerId);

    BigDecimal getTotalPaidAmountByLease(@NonNull Long leaseId, Payment.PaymentType paymentType, @NonNull Long ownerId);

    List<Payment> getOutstandingPaymentsByLease(@NonNull Long leaseId, @NonNull Long ownerId);

    List<Payment> getPaymentHistory(@NonNull Long leaseId, LocalDate startDate, LocalDate endDate, @NonNull Long ownerId);

    BigDecimal calculateOutstandingAmount(@NonNull Long leaseId, LocalDate asOfDate, @NonNull Long ownerId);
}
