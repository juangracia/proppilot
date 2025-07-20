package com.prop_pilot.exception;

import lombok.Getter;

@Getter
public class ValidationException extends RuntimeException {
    private final String path;

    public ValidationException(String message) {
        super(message);
        this.path = null;
    }

    public ValidationException(String message, String path) {
        super(message);
        this.path = path;
    }
}
