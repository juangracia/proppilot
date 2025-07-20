package com.prop_pilot.repository;

import com.prop_pilot.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByPropertyUnitId(Long propertyUnitId);
    List<Payment> findByPropertyUnitIdAndStatus(Long propertyUnitId, Payment.PaymentStatus status);
    List<Payment> findByMonthYear(String monthYear);
    List<Payment> findByPaymentType(Payment.PaymentType paymentType);
    List<Payment> findByPropertyUnitIdAndPaymentType(Long propertyUnitId, Payment.PaymentType paymentType);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.propertyUnit.id = :propertyUnitId AND p.paymentType = :paymentType")
    BigDecimal sumAmountByPropertyUnitIdAndPaymentType(@Param("propertyUnitId") Long propertyUnitId, @Param("paymentType") Payment.PaymentType paymentType);
    
    @Query("SELECT p FROM Payment p WHERE p.propertyUnit.id = :propertyUnitId AND p.paymentDate BETWEEN :startDate AND :endDate")
    List<Payment> findByPropertyUnitIdAndPaymentDateBetween(@Param("propertyUnitId") Long propertyUnitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
