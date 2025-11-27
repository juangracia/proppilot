package com.mirent.service;

import com.mirent.dto.AuthResponse;
import com.mirent.entity.User;

public interface AuthService {
    AuthResponse authenticateWithGoogle(String credential);
    User getCurrentUser(String email);
}
