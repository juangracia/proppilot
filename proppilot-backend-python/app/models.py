"""
Central model registry to ensure all SQLAlchemy models are imported and registered
before the ORM is used. This resolves relationship resolution issues.
"""

# Import all models to register them with SQLAlchemy's mapper
from app.domain.users.models import User
from app.domain.properties.models import PropertyUnit
from app.domain.tenants.models import Tenant
from app.domain.leases.models import Lease, lease_tenants
from app.domain.payments.models import Payment
from app.domain.indices.models import IndexValue

__all__ = [
    "User",
    "PropertyUnit",
    "Tenant",
    "Lease",
    "lease_tenants",
    "Payment",
    "IndexValue",
]
