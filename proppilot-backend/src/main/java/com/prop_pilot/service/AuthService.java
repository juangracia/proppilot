package com.prop_pilot.service;

import com.prop_pilot.dto.AuthResponse;
import com.prop_pilot.entity.User;

public interface AuthService {
    AuthResponse authenticateWithGoogle(String credential);
    User getCurrentUser(String email);
}
