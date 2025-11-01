package com.prop_pilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.prop_pilot.entity.Payment;
import com.prop_pilot.entity.PropertyUnit;
import com.prop_pilot.exception.GlobalExceptionHandler;
import com.prop_pilot.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
@Import(GlobalExceptionHandler.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    private ObjectMapper objectMapper;
    private Payment testPayment;
    private PropertyUnit testPropertyUnit;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        testPropertyUnit = new PropertyUnit();
        testPropertyUnit.setId(1L);
        testPropertyUnit.setAddress("123 Test Street");
        testPropertyUnit.setBaseRentAmount(new BigDecimal("1500.00"));

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setAmount(new BigDecimal("1500.00"));
        testPayment.setPaymentDate(LocalDate.now());
        testPayment.setPaymentType(Payment.PaymentType.RENT);
        testPayment.setStatus(Payment.PaymentStatus.PAID);
        testPayment.setPropertyUnit(testPropertyUnit);
    }

    @Test
    void testCreatePayment_Success() throws Exception {
        // Given
        Payment newPayment = new Payment();
        newPayment.setAmount(new BigDecimal("1500.00"));
        newPayment.setPaymentDate(LocalDate.now());
        newPayment.setPaymentType(Payment.PaymentType.RENT);
        newPayment.setPropertyUnit(testPropertyUnit);

        when(paymentService.createPayment(any(Payment.class))).thenReturn(testPayment);

        // When & Then
        mockMvc.perform(post("/api/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPayment)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testPayment.getId()))
                .andExpect(jsonPath("$.amount").value(testPayment.getAmount().doubleValue()))
                .andExpect(jsonPath("$.paymentType").value(testPayment.getPaymentType().toString()));

        verify(paymentService, times(1)).createPayment(any(Payment.class));
    }

    @Test
    void testGetPaymentById_Success() throws Exception {
        // Given
        Long paymentId = 1L;
        when(paymentService.getPaymentById(paymentId)).thenReturn(testPayment);

        // When & Then
        mockMvc.perform(get("/api/payments/{id}", paymentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPayment.getId()))
                .andExpect(jsonPath("$.amount").value(testPayment.getAmount().doubleValue()));

        verify(paymentService, times(1)).getPaymentById(paymentId);
    }

    @Test
    void testGetAllPayments_Success() throws Exception {
        // Given
        Payment payment2 = new Payment();
        payment2.setId(2L);
        payment2.setAmount(new BigDecimal("2000.00"));
        payment2.setPaymentType(Payment.PaymentType.DEPOSIT);

        List<Payment> payments = Arrays.asList(testPayment, payment2);
        when(paymentService.getAllPayments()).thenReturn(payments);

        // When & Then
        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(testPayment.getId()))
                .andExpect(jsonPath("$[1].id").value(payment2.getId()));

        verify(paymentService, times(1)).getAllPayments();
    }

    @Test
    void testGetPaymentsByPropertyUnit_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        List<Payment> payments = Arrays.asList(testPayment);
        when(paymentService.getPaymentsByPropertyUnit(propertyUnitId)).thenReturn(payments);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}", propertyUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(testPayment.getId()));

        verify(paymentService, times(1)).getPaymentsByPropertyUnit(propertyUnitId);
    }

    @Test
    void testUpdatePayment_Success() throws Exception {
        // Given
        Long paymentId = 1L;
        Payment updateData = new Payment();
        updateData.setAmount(new BigDecimal("1800.00"));
        updateData.setStatus(Payment.PaymentStatus.PAID);

        Payment updatedPayment = new Payment();
        updatedPayment.setId(paymentId);
        updatedPayment.setAmount(new BigDecimal("1800.00"));
        updatedPayment.setStatus(Payment.PaymentStatus.PAID);

        when(paymentService.updatePayment(eq(paymentId), any(Payment.class))).thenReturn(updatedPayment);

        // When & Then
        mockMvc.perform(put("/api/payments/{id}", paymentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedPayment.getId()))
                .andExpect(jsonPath("$.amount").value(updatedPayment.getAmount().doubleValue()));

        verify(paymentService, times(1)).updatePayment(eq(paymentId), any(Payment.class));
    }

    @Test
    void testDeletePayment_Success() throws Exception {
        // Given
        Long paymentId = 1L;
        doNothing().when(paymentService).deletePayment(paymentId);

        // When & Then
        mockMvc.perform(delete("/api/payments/{id}", paymentId))
                .andExpect(status().isNoContent());

        verify(paymentService, times(1)).deletePayment(paymentId);
    }

    @Test
    void testCalculateAdjustedRent_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        BigDecimal adjustedRent = new BigDecimal("1545.00");
        when(paymentService.calculateAdjustedRent(eq(propertyUnitId), any(LocalDate.class)))
                .thenReturn(adjustedRent);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/adjusted-rent", propertyUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(adjustedRent.doubleValue()));

        verify(paymentService, times(1)).calculateAdjustedRent(eq(propertyUnitId), any(LocalDate.class));
    }

    @Test
    void testCalculateAdjustedRent_WithDate() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        LocalDate effectiveDate = LocalDate.of(2024, 6, 1);
        BigDecimal adjustedRent = new BigDecimal("1545.00");
        when(paymentService.calculateAdjustedRent(eq(propertyUnitId), eq(effectiveDate)))
                .thenReturn(adjustedRent);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/adjusted-rent", propertyUnitId)
                .param("effectiveDate", "2024-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(adjustedRent.doubleValue()));

        verify(paymentService, times(1)).calculateAdjustedRent(eq(propertyUnitId), eq(effectiveDate));
    }

    @Test
    void testGetOutstandingPayments_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        Payment pendingPayment = new Payment();
        pendingPayment.setId(2L);
        pendingPayment.setStatus(Payment.PaymentStatus.PENDING);
        List<Payment> outstandingPayments = Arrays.asList(pendingPayment);
        when(paymentService.getOutstandingPayments(propertyUnitId)).thenReturn(outstandingPayments);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/outstanding", propertyUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(paymentService, times(1)).getOutstandingPayments(propertyUnitId);
    }

    @Test
    void testCalculateOutstandingAmount_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        BigDecimal outstandingAmount = new BigDecimal("4500.00");
        when(paymentService.calculateOutstandingAmount(eq(propertyUnitId), any(LocalDate.class)))
                .thenReturn(outstandingAmount);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/outstanding-amount", propertyUnitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(outstandingAmount.doubleValue()));

        verify(paymentService, times(1)).calculateOutstandingAmount(eq(propertyUnitId), any(LocalDate.class));
    }

    @Test
    void testGetTotalPaidAmount_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        Payment.PaymentType paymentType = Payment.PaymentType.RENT;
        BigDecimal totalPaid = new BigDecimal("3000.00");
        when(paymentService.getTotalPaidAmount(propertyUnitId, paymentType)).thenReturn(totalPaid);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/total-paid", propertyUnitId)
                .param("paymentType", "RENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(totalPaid.doubleValue()));

        verify(paymentService, times(1)).getTotalPaidAmount(propertyUnitId, paymentType);
    }

    @Test
    void testGetPaymentHistory_Success() throws Exception {
        // Given
        Long propertyUnitId = 1L;
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 12, 31);
        List<Payment> paymentHistory = Arrays.asList(testPayment);
        when(paymentService.getPaymentHistory(propertyUnitId, startDate, endDate)).thenReturn(paymentHistory);

        // When & Then
        mockMvc.perform(get("/api/payments/property-unit/{propertyUnitId}/history", propertyUnitId)
                .param("startDate", "2024-01-01")
                .param("endDate", "2024-12-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(paymentService, times(1)).getPaymentHistory(propertyUnitId, startDate, endDate);
    }
}

