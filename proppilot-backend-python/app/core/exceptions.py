from typing import Any


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, details: Any = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class ResourceNotFoundException(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id {identifier} not found"
        super().__init__(message)
        self.resource = resource
        self.identifier = identifier


class ValidationException(AppException):
    """Raised when validation fails."""

    def __init__(self, message: str, field: str | None = None, details: Any = None):
        super().__init__(message, details)
        self.field = field


class BusinessLogicException(AppException):
    """Raised when a business rule is violated."""

    pass


class AuthenticationException(AppException):
    """Raised when authentication fails."""

    pass


class AuthorizationException(AppException):
    """Raised when authorization fails."""

    pass


class DuplicateResourceException(AppException):
    """Raised when attempting to create a duplicate resource."""

    def __init__(self, resource: str, field: str, value: Any):
        message = f"{resource} with {field} '{value}' already exists"
        super().__init__(message)
        self.resource = resource
        self.field = field
        self.value = value
