package com.prop_pilot.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        log.debug("JwtAuthenticationFilter: Processing request to {} - Auth header present: {}",
                request.getRequestURI(), authHeader != null);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("JwtAuthenticationFilter: No Bearer token found, continuing without auth");
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        log.debug("JwtAuthenticationFilter: Found JWT token");

        if (jwtUtil.isTokenValid(jwt)) {
            String email = jwtUtil.extractEmail(jwt);
            String name = jwtUtil.extractName(jwt);
            log.info("JwtAuthenticationFilter: Valid JWT for user: {} (name: {})", email, name);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    Collections.emptyList()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            log.info("JwtAuthenticationFilter: Set authentication in SecurityContext for: {}", email);
        } else {
            log.warn("JwtAuthenticationFilter: Invalid JWT token");
        }

        filterChain.doFilter(request, response);
    }
}
