package com.prop_pilot.service;

import com.prop_pilot.entity.User;
import com.prop_pilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If no authentication or anonymous, check for local profile
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {

            // For local development, create/return a default user
            if (activeProfile != null && activeProfile.contains("local")) {
                return getOrCreateLocalUser();
            }
            throw new IllegalStateException("User not authenticated");
        }

        String email = (String) authentication.getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database: " + email));
    }

    public Optional<User> getCurrentUserOptional() {
        try {
            return Optional.of(getCurrentUser());
        } catch (IllegalStateException e) {
            return Optional.empty();
        }
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private User getOrCreateLocalUser() {
        String localEmail = "local-dev@proppilot.local";
        return userRepository.findByEmail(localEmail)
                .orElseGet(() -> {
                    User localUser = new User();
                    localUser.setEmail(localEmail);
                    localUser.setFullName("Local Developer");
                    localUser.setProvider("local");
                    localUser.setProviderId("local-dev-001");
                    localUser.setCreatedAt(LocalDateTime.now());
                    localUser.setLastLoginAt(LocalDateTime.now());
                    return userRepository.save(localUser);
                });
    }
}
