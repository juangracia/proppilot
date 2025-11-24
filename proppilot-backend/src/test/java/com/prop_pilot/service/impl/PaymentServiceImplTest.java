package com.prop_pilot.service.impl;

import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.exception.BusinessLogicException;
import com.prop_pilot.exception.ResourceNotFoundException;
import com.prop_pilot.repository.PaymentRepository;
import com.prop_pilot.repository.PropertyUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PropertyUnitRepository propertyUnitRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Payment testPayment;
    private PropertyUnit testPropertyUnit;

    @BeforeEach
    void setUp() {
        testPropertyUnit = new PropertyUnit();
        testPropertyUnit.setId(1L);
        testPropertyUnit.setAddress("123 Test Street");
        testPropertyUnit.setBaseRentAmount(new BigDecimal("1500.00"));
        testPropertyUnit.setLeaseStartDate(LocalDate.of(2024, 1, 1));

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setAmount(new BigDecimal("1500.00"));
        testPayment.setPaymentDate(LocalDate.now());
        testPayment.setPaymentType(Payment.PaymentType.RENT);
        testPayment.setStatus(Payment.PaymentStatus.PAID);
        testPayment.setPropertyUnit(testPropertyUnit);
    }

    @Test
    void testCreatePayment_Success() {
        // Given
        Payment newPayment = new Payment();
        newPayment.setAmount(new BigDecimal("1500.00"));
        newPayment.setPaymentType(Payment.PaymentType.RENT);
        newPayment.setPropertyUnit(testPropertyUnit);

        when(propertyUnitRepository.findById(testPropertyUnit.getId())).thenReturn(Optional.of(testPropertyUnit));
        when(paymentRepository.save(newPayment)).thenReturn(testPayment);

        // When
        Payment result = paymentService.createPayment(newPayment);

        // Then
        assertNotNull(result);
        assertEquals(testPayment.getId(), result.getId());
        verify(propertyUnitRepository, times(1)).findById(testPropertyUnit.getId());
        verify(paymentRepository, times(1)).save(newPayment);
    }

    @Test
    void testCreatePayment_PropertyUnitNotFound() {
        // Given
        Payment newPayment = new Payment();
        newPayment.setPropertyUnit(testPropertyUnit);

        when(propertyUnitRepository.findById(testPropertyUnit.getId())).thenReturn(Optional.empty());

        // When & Then
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> paymentService.createPayment(newPayment));

        assertTrue(exception.getMessage().contains("Property unit not found"));
        verify(propertyUnitRepository, times(1)).findById(testPropertyUnit.getId());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void testCreatePayment_AmountExceedsLimit() {
        // Given
        Payment newPayment = new Payment();
        newPayment.setAmount(new BigDecimal("5000.00")); // More than 3 months of rent (4500)
        newPayment.setPropertyUnit(testPropertyUnit);

        when(propertyUnitRepository.findById(testPropertyUnit.getId())).thenReturn(Optional.of(testPropertyUnit));

        // When & Then
        BusinessLogicException exception = assertThrows(BusinessLogicException.class,
                () -> paymentService.createPayment(newPayment));

        assertTrue(exception.getMessage().contains("cannot exceed 3 months of rent"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void testGetPaymentById_Success() {
        // Given
        Long paymentId = 1L;
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));

        // When
        Payment result = paymentService.getPaymentById(paymentId);

        // Then
        assertNotNull(result);
        assertEquals(testPayment.getId(), result.getId());
        verify(paymentRepository, times(1)).findById(paymentId);
    }

    @Test
    void testGetPaymentById_NotFound() {
        // Given
        Long paymentId = 999L;
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

        // When & Then
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> paymentService.getPaymentById(paymentId));

        assertEquals("Payment not found with id: " + paymentId, exception.getMessage());
        verify(paymentRepository, times(1)).findById(paymentId);
    }

    @Test
    void testGetAllPayments_Success() {
        // Given
        Payment payment2 = new Payment();
        payment2.setId(2L);
        List<Payment> payments = Arrays.asList(testPayment, payment2);
        when(paymentRepository.findAll()).thenReturn(payments);

        // When
        List<Payment> result = paymentService.getAllPayments();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(paymentRepository, times(1)).findAll();
    }

    @Test
    void testGetPaymentsByPropertyUnit_Success() {
        // Given
        Long propertyUnitId = 1L;
        List<Payment> payments = Arrays.asList(testPayment);
        when(paymentRepository.findByPropertyUnitId(propertyUnitId)).thenReturn(payments);

        // When
        List<Payment> result = paymentService.getPaymentsByPropertyUnit(propertyUnitId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(paymentRepository, times(1)).findByPropertyUnitId(propertyUnitId);
    }

    @Test
    void testUpdatePayment_Success() {
        // Given
        Long paymentId = 1L;
        Payment updateData = new Payment();
        updateData.setAmount(new BigDecimal("1800.00"));
        updateData.setStatus(Payment.PaymentStatus.PAID);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(testPayment)).thenReturn(testPayment);

        // When
        Payment result = paymentService.updatePayment(paymentId, updateData);

        // Then
        assertNotNull(result);
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(paymentRepository, times(1)).save(testPayment);
    }

    @Test
    void testDeletePayment_Success() {
        // Given
        Long paymentId = 1L;
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(testPayment));
        doNothing().when(paymentRepository).delete(testPayment);

        // When
        paymentService.deletePayment(paymentId);

        // Then
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(paymentRepository, times(1)).delete(testPayment);
    }

    @Test
    void testCalculateAdjustedRent_Success() {
        // Given
        Long propertyUnitId = 1L;
        LocalDate effectiveDate = LocalDate.of(2024, 1, 1);
        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.of(testPropertyUnit));

        // When
        BigDecimal result = paymentService.calculateAdjustedRent(propertyUnitId, effectiveDate);

        // Then
        assertNotNull(result);
        // No adjustment for same date, should return base rent
        assertEquals(0, testPropertyUnit.getBaseRentAmount().compareTo(result));
        verify(propertyUnitRepository, times(1)).findById(propertyUnitId);
    }

    @Test
    void testGetOutstandingPayments_Success() {
        // Given
        Long propertyUnitId = 1L;
        Payment pendingPayment = new Payment();
        pendingPayment.setStatus(Payment.PaymentStatus.PENDING);
        List<Payment> outstandingPayments = Arrays.asList(pendingPayment);
        when(paymentRepository.findByPropertyUnitIdAndStatus(propertyUnitId, Payment.PaymentStatus.PENDING))
                .thenReturn(outstandingPayments);

        // When
        List<Payment> result = paymentService.getOutstandingPayments(propertyUnitId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(paymentRepository, times(1)).findByPropertyUnitIdAndStatus(propertyUnitId, Payment.PaymentStatus.PENDING);
    }

    @Test
    void testGetTotalPaidAmount_Success() {
        // Given
        Long propertyUnitId = 1L;
        Payment.PaymentType paymentType = Payment.PaymentType.RENT;
        BigDecimal total = new BigDecimal("3000.00");
        when(paymentRepository.sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, paymentType)).thenReturn(total);

        // When
        BigDecimal result = paymentService.getTotalPaidAmount(propertyUnitId, paymentType);

        // Then
        assertNotNull(result);
        assertEquals(total, result);
        verify(paymentRepository, times(1)).sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, paymentType);
    }

    @Test
    void testGetTotalPaidAmount_ReturnsZeroWhenNull() {
        // Given
        Long propertyUnitId = 1L;
        Payment.PaymentType paymentType = Payment.PaymentType.RENT;
        when(paymentRepository.sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, paymentType)).thenReturn(null);

        // When
        BigDecimal result = paymentService.getTotalPaidAmount(propertyUnitId, paymentType);

        // Then
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testGetPaymentHistory_Success() {
        // Given
        Long propertyUnitId = 1L;
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 12, 31);
        List<Payment> paymentHistory = Arrays.asList(testPayment);
        when(paymentRepository.findByPropertyUnitIdAndPaymentDateBetween(propertyUnitId, startDate, endDate))
                .thenReturn(paymentHistory);

        // When
        List<Payment> result = paymentService.getPaymentHistory(propertyUnitId, startDate, endDate);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(paymentRepository, times(1))
                .findByPropertyUnitIdAndPaymentDateBetween(propertyUnitId, startDate, endDate);
    }

    @Test
    void testCalculateOutstandingAmount_Success() {
        // Given
        Long propertyUnitId = 1L;
        LocalDate asOfDate = LocalDate.of(2024, 3, 1);

        when(propertyUnitRepository.findById(propertyUnitId)).thenReturn(Optional.of(testPropertyUnit));
        when(paymentRepository.sumAmountByPropertyUnitIdAndPaymentType(propertyUnitId, Payment.PaymentType.RENT))
                .thenReturn(BigDecimal.ZERO);

        // When
        BigDecimal result = paymentService.calculateOutstandingAmount(propertyUnitId, asOfDate);

        // Then
        assertNotNull(result);
        assertTrue(result.compareTo(BigDecimal.ZERO) >= 0);
        // Note: calculateAdjustedRent is called internally which also calls findById
        verify(propertyUnitRepository, atLeastOnce()).findById(propertyUnitId);
    }
}

