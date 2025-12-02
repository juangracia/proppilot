package com.prop_pilot.controller;

import com.prop_pilot.dto.AuthResponse;
import com.prop_pilot.dto.GoogleAuthRequest;
import com.prop_pilot.dto.LocalAuthRequest;
import com.prop_pilot.entity.User;
import com.prop_pilot.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API for user authentication")
public class AuthController {

    private final AuthService authService;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @PostMapping("/google")
    @Operation(summary = "Authenticate with Google", description = "Validates Google credential and returns JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "401", description = "Invalid Google credential")
    })
    public ResponseEntity<AuthResponse> authenticateWithGoogle(@RequestBody GoogleAuthRequest request) {
        try {
            AuthResponse response = authService.authenticateWithGoogle(request.getCredential());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        try {
            User user = authService.getCurrentUser(authentication.getName());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/local")
    @Operation(summary = "Authenticate locally (dev only)", description = "Creates or logs in a local user without Google OAuth. Only available in local profile.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "403", description = "Local auth not available in this environment")
    })
    public ResponseEntity<AuthResponse> authenticateLocal(@RequestBody LocalAuthRequest request) {
        if (activeProfile == null || !activeProfile.contains("local")) {
            return ResponseEntity.status(403).build();
        }
        try {
            AuthResponse response = authService.authenticateLocal(request.getEmail(), request.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).build();
        }
    }
}
