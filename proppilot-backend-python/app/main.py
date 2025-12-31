from contextlib import asynccontextmanager

from fastapi import FastAPI

# Import all models early to ensure proper SQLAlchemy mapper registration
import app.models  # noqa: F401
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.config import get_settings
from app.core.exception_handlers import (
    authentication_exception_handler,
    authorization_exception_handler,
    business_logic_exception_handler,
    duplicate_resource_exception_handler,
    generic_exception_handler,
    pydantic_validation_exception_handler,
    resource_not_found_handler,
    validation_exception_handler,
)
from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    BusinessLogicException,
    DuplicateResourceException,
    ResourceNotFoundException,
    ValidationException,
)
from app.domain.auth.router import router as auth_router
from app.domain.countries.router import router as countries_router
from app.domain.data_portability.router import router as data_portability_router
from app.domain.indices.router import router as indices_router
from app.domain.leases.router import router as leases_router
from app.domain.payments.router import router as payments_router
from app.domain.properties.router import router as properties_router
from app.domain.tenants.router import router as tenants_router
from app.scheduler.tasks import shutdown_scheduler, start_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    print(f"Starting {settings.app_name}...")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'configured'}")

    # Initialize scheduler
    if settings.environment != "test":
        start_scheduler()

    yield

    # Shutdown
    print("Shutting down...")
    if settings.environment != "test":
        shutdown_scheduler()


app = FastAPI(
    title=settings.app_name,
    description="Property Management API - Python/FastAPI Backend",
    version="1.0.0",
    docs_url="/swagger-ui.html",
    openapi_url="/api-docs",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)
app.add_exception_handler(ValidationException, validation_exception_handler)
app.add_exception_handler(BusinessLogicException, business_logic_exception_handler)
app.add_exception_handler(DuplicateResourceException, duplicate_resource_exception_handler)
app.add_exception_handler(AuthenticationException, authentication_exception_handler)
app.add_exception_handler(AuthorizationException, authorization_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.app_name}


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(properties_router, prefix="/api/property-units", tags=["Property Units"])
app.include_router(tenants_router, prefix="/api/tenants", tags=["Tenants"])
app.include_router(leases_router, prefix="/api/leases", tags=["Leases"])
app.include_router(payments_router, prefix="/api/payments", tags=["Payments"])
app.include_router(indices_router, prefix="/api/indices", tags=["Indices"])
app.include_router(countries_router, prefix="/api/countries", tags=["Countries"])
app.include_router(data_portability_router, prefix="/api/data", tags=["Data Portability"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
