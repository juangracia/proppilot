package com.prop_pilot.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LeasePaymentDueDayValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private Set<ConstraintViolation<Lease>> violationsFor(Integer dueDay) {
        Lease lease = new Lease();
        lease.setPaymentDueDay(dueDay);
        return validator.validateProperty(lease, "paymentDueDay");
    }

    @Test
    void zeroAndTwentyNineAreRejectedWithSpanishMessage() {
        for (int invalid : new int[]{0, 29}) {
            Set<ConstraintViolation<Lease>> violations = violationsFor(invalid);
            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getMessage())
                    .isEqualTo("El día de vencimiento debe estar entre 1 y 28");
        }
    }

    @Test
    void oneTenTwentyEightAndNullAreValid() {
        assertThat(violationsFor(1)).isEmpty();
        assertThat(violationsFor(10)).isEmpty();
        assertThat(violationsFor(28)).isEmpty();
        assertThat(violationsFor(null)).isEmpty();
    }
}
