import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
)
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.domain.payments.models import Payment
    from app.domain.properties.models import PropertyUnit
    from app.domain.tenants.models import Tenant
    from app.domain.users.models import User


class LeaseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"


class AdjustmentIndex(str, enum.Enum):
    ICL = "ICL"
    IPC = "IPC"
    DOLAR_BLUE = "DOLAR_BLUE"
    DOLAR_OFICIAL = "DOLAR_OFICIAL"
    DOLAR_MEP = "DOLAR_MEP"
    NONE = "NONE"


# Junction table for lease-tenants many-to-many relationship
lease_tenants = Table(
    "lease_tenants",
    Base.metadata,
    Column("lease_id", BigInteger, ForeignKey("leases.id"), primary_key=True),
    Column("tenant_id", BigInteger, ForeignKey("tenants.id"), primary_key=True),
)


class Lease(Base):
    __tablename__ = "leases"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    property_unit_id = Column(BigInteger, ForeignKey("property_units.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    monthly_rent = Column(Numeric(10, 2), nullable=False)

    # Status stored as VARCHAR with CHECK constraint
    status = Column(String(255), nullable=False, default="ACTIVE")
    # Adjustment index stored as VARCHAR with CHECK constraint
    adjustment_index = Column(String(255), nullable=False, default="ICL")
    adjustment_frequency_months = Column(Integer, default=12)
    country_code = Column(String(2), default="AR")

    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    # Soft delete fields
    deleted = Column(Boolean, default=False, server_default="false")
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    property_unit = relationship("PropertyUnit", back_populates="leases", lazy="selectin")
    tenants = relationship(
        "Tenant",
        secondary=lease_tenants,
        back_populates="leases",
        lazy="selectin",
    )
    payments = relationship(
        "Payment",
        back_populates="lease",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    owner = relationship("User", back_populates="leases", lazy="selectin")

    def is_active(self) -> bool:
        """Check if the lease is currently active based on status and dates."""
        if self.status != "ACTIVE":
            return False
        today = date.today()
        return self.start_date <= today <= self.end_date

    def get_tenant_names(self) -> list[str]:
        """Get list of all tenant names."""
        if not self.tenants:
            return []
        return [tenant.full_name for tenant in self.tenants]

    def get_tenant_emails(self) -> list[str]:
        """Get list of all tenant emails."""
        if not self.tenants:
            return []
        return [tenant.email for tenant in self.tenants]

    def get_tenant_phones(self) -> list[str]:
        """Get list of all tenant phones."""
        if not self.tenants:
            return []
        return [tenant.phone for tenant in self.tenants]

    def get_first_tenant(self) -> "Tenant | None":
        """Get the first tenant (for backward compatibility)."""
        if not self.tenants:
            return None
        return next(iter(self.tenants), None)
