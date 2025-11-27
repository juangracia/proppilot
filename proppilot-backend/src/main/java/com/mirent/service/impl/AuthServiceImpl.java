package com.mirent.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.mirent.dto.AuthResponse;
import com.mirent.entity.User;
import com.mirent.repository.UserRepository;
import com.mirent.security.JwtUtil;
import com.mirent.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Override
    public AuthResponse authenticateWithGoogle(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            String googleId = payload.getSubject();

            User user = userRepository.findByProviderId(googleId)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setFullName(name);
                        newUser.setPictureUrl(picture);
                        newUser.setProvider("google");
                        newUser.setProviderId(googleId);
                        return userRepository.save(newUser);
                    });

            user.setLastLoginAt(LocalDateTime.now());
            user.setFullName(name);
            user.setPictureUrl(picture);
            userRepository.save(user);

            String token = jwtUtil.generateToken(email, name, picture);
            return new AuthResponse(token, email, name, picture);

        } catch (Exception e) {
            throw new RuntimeException("Failed to authenticate with Google: " + e.getMessage(), e);
        }
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
