package com.prop_pilot.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    private final String path;

    public ResourceNotFoundException(String message) {
        super(message);
        this.path = null;
    }

    public ResourceNotFoundException(String message, String path) {
        super(message);
        this.path = path;
    }
}
