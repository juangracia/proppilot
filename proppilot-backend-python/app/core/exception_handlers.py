from datetime import datetime

from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    BusinessLogicException,
    DuplicateResourceException,
    ResourceNotFoundException,
    ValidationException,
)


def create_error_response(
    status_code: int,
    error: str,
    message: str,
    path: str | None = None,
    validation_errors: dict | None = None,
) -> JSONResponse:
    content = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": status_code,
        "error": error,
        "message": message,
    }
    if path:
        content["path"] = path
    if validation_errors:
        content["validationErrors"] = validation_errors
    return JSONResponse(status_code=status_code, content=content)


async def resource_not_found_handler(
    request: Request, exc: ResourceNotFoundException
) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_404_NOT_FOUND,
        error="Not Found",
        message=exc.message,
        path=str(request.url.path),
    )


async def validation_exception_handler(
    request: Request, exc: ValidationException
) -> JSONResponse:
    validation_errors = {}
    if exc.field:
        validation_errors[exc.field] = exc.message
    return create_error_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        error="Bad Request",
        message=exc.message,
        path=str(request.url.path),
        validation_errors=validation_errors if validation_errors else None,
    )


async def business_logic_exception_handler(
    request: Request, exc: BusinessLogicException
) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error="Unprocessable Entity",
        message=exc.message,
        path=str(request.url.path),
    )


async def duplicate_resource_exception_handler(
    request: Request, exc: DuplicateResourceException
) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_409_CONFLICT,
        error="Conflict",
        message=exc.message,
        path=str(request.url.path),
    )


async def authentication_exception_handler(
    request: Request, exc: AuthenticationException
) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_401_UNAUTHORIZED,
        error="Unauthorized",
        message=exc.message,
        path=str(request.url.path),
    )


async def authorization_exception_handler(
    request: Request, exc: AuthorizationException
) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_403_FORBIDDEN,
        error="Forbidden",
        message=exc.message,
        path=str(request.url.path),
    )


async def pydantic_validation_exception_handler(
    request: Request, exc: ValidationError
) -> JSONResponse:
    validation_errors = {}
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        validation_errors[field] = error["msg"]
    return create_error_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        error="Bad Request",
        message="Validation failed",
        path=str(request.url.path),
        validation_errors=validation_errors,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error="Internal Server Error",
        message="An unexpected error occurred",
        path=str(request.url.path),
    )
