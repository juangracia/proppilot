package com.mirent.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test-secret-key-for-testing-purposes-32-chars");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);
    }

    @Test
    void testGenerateToken() {
        String token = jwtUtil.generateToken("test@example.com", "Test User", "https://example.com/pic.jpg");

        assertNotNull(token);
        assertTrue(token.length() > 0);
        assertTrue(token.contains("."));
    }

    @Test
    void testExtractEmail() {
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email, "Test User", "https://example.com/pic.jpg");

        String extractedEmail = jwtUtil.extractEmail(token);

        assertEquals(email, extractedEmail);
    }

    @Test
    void testExtractName() {
        String name = "Test User";
        String token = jwtUtil.generateToken("test@example.com", name, "https://example.com/pic.jpg");

        String extractedName = jwtUtil.extractName(token);

        assertEquals(name, extractedName);
    }

    @Test
    void testIsTokenValid_ValidToken() {
        String token = jwtUtil.generateToken("test@example.com", "Test User", "https://example.com/pic.jpg");

        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void testIsTokenValid_InvalidToken() {
        assertFalse(jwtUtil.isTokenValid("invalid-token"));
    }

    @Test
    void testIsTokenValid_ExpiredToken() {
        JwtUtil shortExpiryJwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(shortExpiryJwtUtil, "secret", "test-secret-key-for-testing-purposes-32-chars");
        ReflectionTestUtils.setField(shortExpiryJwtUtil, "expiration", -1000L);

        String token = shortExpiryJwtUtil.generateToken("test@example.com", "Test User", "https://example.com/pic.jpg");

        assertFalse(jwtUtil.isTokenValid(token));
    }
}
