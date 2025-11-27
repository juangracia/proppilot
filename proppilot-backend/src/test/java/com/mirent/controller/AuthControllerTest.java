package com.mirent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirent.dto.AuthResponse;
import com.mirent.dto.GoogleAuthRequest;
import com.mirent.entity.User;
import com.mirent.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private AuthResponse testAuthResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setPictureUrl("https://example.com/picture.jpg");
        testUser.setProvider("google");
        testUser.setProviderId("google-123");
        testUser.setCreatedAt(LocalDateTime.now());

        testAuthResponse = new AuthResponse(
                "test-jwt-token",
                "test@example.com",
                "Test User",
                "https://example.com/picture.jpg"
        );
    }

    @Test
    void testAuthenticateWithGoogle_Success() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCredential("valid-google-credential");

        when(authService.authenticateWithGoogle("valid-google-credential"))
                .thenReturn(testAuthResponse);

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-jwt-token"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"));
    }

    @Test
    void testAuthenticateWithGoogle_InvalidCredential() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCredential("invalid-credential");

        when(authService.authenticateWithGoogle("invalid-credential"))
                .thenThrow(new RuntimeException("Invalid Google token"));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetCurrentUser_Authenticated() throws Exception {
        when(authService.getCurrentUser("test@example.com"))
                .thenReturn(testUser);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    void testGetCurrentUser_NotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
