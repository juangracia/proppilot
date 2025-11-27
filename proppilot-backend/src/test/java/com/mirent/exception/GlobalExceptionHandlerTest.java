package com.mirent.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void testResourceNotFoundExceptionHandler() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Test message", "/test/path");

        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFoundException(ex);

        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Resource Not Found", response.getBody().getError());
        assertEquals("Test message", response.getBody().getMessage());
        assertEquals("/test/path", response.getBody().getPath());
        assertNotNull(response.getBody().getTimestamp());
    }

    @Test
    void testValidationExceptionHandler() {
        ValidationException ex = new ValidationException("Test validation", "/test/path");

        ResponseEntity<ErrorResponse> response = handler.handleValidationException(ex);

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Validation Error", response.getBody().getError());
        assertEquals("Test validation", response.getBody().getMessage());
    }

    @Test
    void testBusinessLogicExceptionHandler() {
        BusinessLogicException ex = new BusinessLogicException("Test business logic", "/test/path");

        ResponseEntity<ErrorResponse> response = handler.handleBusinessLogicException(ex);

        assertEquals(422, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(422, response.getBody().getStatus());
        assertEquals("Business Logic Error", response.getBody().getError());
        assertEquals("Test business logic", response.getBody().getMessage());
    }

    @Test
    void testRuntimeExceptionHandler() {
        RuntimeException ex = new RuntimeException("Test runtime error");

        ResponseEntity<ErrorResponse> response = handler.handleRuntimeException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertTrue(response.getBody().getMessage().contains("Test runtime error"));
    }

    @Test
    void testGenericExceptionHandler() {
        Exception ex = new Exception("Test generic error");

        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertEquals("An unexpected error occurred", response.getBody().getMessage());
    }

    @Test
    void testMethodArgumentNotValidExceptionHandler() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("testObject", "name", "Name is required");
        when(bindingResult.getAllErrors()).thenReturn(Collections.singletonList(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentNotValidException(ex);

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Validation Failed", response.getBody().getError());
        assertNotNull(response.getBody().getValidationErrors());
        assertTrue(response.getBody().getValidationErrors().containsKey("name"));
    }
}

