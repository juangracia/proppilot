package com.prop_pilot.repository;

import com.prop_pilot.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByLeaseId(Long leaseId);

    List<Payment> findByLeaseIdAndStatus(Long leaseId, Payment.PaymentStatus status);

    List<Payment> findByPaymentType(Payment.PaymentType paymentType);

    List<Payment> findByLeaseIdAndPaymentType(Long leaseId, Payment.PaymentType paymentType);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.lease.id = :leaseId AND p.paymentType = :paymentType")
    BigDecimal sumAmountByLeaseIdAndPaymentType(
        @Param("leaseId") Long leaseId,
        @Param("paymentType") Payment.PaymentType paymentType
    );

    @Query("SELECT p FROM Payment p WHERE p.lease.id = :leaseId AND p.paymentDate BETWEEN :startDate AND :endDate")
    List<Payment> findByLeaseIdAndPaymentDateBetween(
        @Param("leaseId") Long leaseId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT p FROM Payment p " +
           "LEFT JOIN FETCH p.lease l " +
           "LEFT JOIN FETCH l.propertyUnit pu " +
           "LEFT JOIN FETCH l.tenant t " +
           "WHERE l IS NULL OR l.owner.id = :ownerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.lease l " +
           "JOIN FETCH l.propertyUnit pu " +
           "JOIN FETCH l.tenant t " +
           "WHERE p.id = :paymentId AND l.owner.id = :ownerId")
    Optional<Payment> findByIdAndOwnerId(
        @Param("paymentId") Long paymentId,
        @Param("ownerId") Long ownerId
    );

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.lease l " +
           "JOIN FETCH l.propertyUnit pu " +
           "JOIN FETCH l.tenant t " +
           "WHERE l.id = :leaseId AND l.owner.id = :ownerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByLeaseIdAndOwnerId(
        @Param("leaseId") Long leaseId,
        @Param("ownerId") Long ownerId
    );

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.lease l " +
           "JOIN FETCH l.propertyUnit pu " +
           "JOIN FETCH l.tenant t " +
           "WHERE l.propertyUnit.id = :propertyUnitId AND l.owner.id = :ownerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByPropertyUnitIdAndOwnerId(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("ownerId") Long ownerId
    );

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.lease l " +
           "JOIN FETCH l.propertyUnit pu " +
           "JOIN FETCH l.tenant t " +
           "WHERE l.tenant.id = :tenantId AND l.owner.id = :ownerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByTenantIdAndOwnerId(
        @Param("tenantId") Long tenantId,
        @Param("ownerId") Long ownerId
    );

    @Query("SELECT p FROM Payment p " +
           "JOIN FETCH p.lease l " +
           "JOIN FETCH l.propertyUnit pu " +
           "JOIN FETCH l.tenant t " +
           "WHERE l.id = :leaseId AND p.status = :status AND l.owner.id = :ownerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByLeaseIdAndStatusAndOwnerId(
        @Param("leaseId") Long leaseId,
        @Param("status") Payment.PaymentStatus status,
        @Param("ownerId") Long ownerId
    );

    @Query("SELECT SUM(p.amount) FROM Payment p " +
           "WHERE p.lease.id = :leaseId AND p.paymentType = :paymentType AND p.lease.owner.id = :ownerId")
    BigDecimal sumAmountByLeaseIdAndPaymentTypeAndOwnerId(
        @Param("leaseId") Long leaseId,
        @Param("paymentType") Payment.PaymentType paymentType,
        @Param("ownerId") Long ownerId
    );
}
