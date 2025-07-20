package com.prop_pilot.exception;

import lombok.Getter;

@Getter
public class BusinessLogicException extends RuntimeException {
    private final String path;

    public BusinessLogicException(String message) {
        super(message);
        this.path = null;
    }

    public BusinessLogicException(String message, String path) {
        super(message);
        this.path = path;
    }
}
