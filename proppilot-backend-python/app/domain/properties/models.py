from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Column, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.domain.leases.models import Lease
    from app.domain.users.models import User


class PropertyUnit(Base):
    __tablename__ = "property_units"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # Legacy address field
    address = Column(String(255), nullable=False)

    # Structured address fields
    street = Column(String(150), nullable=True)
    street_number = Column(String(20), nullable=True)
    floor = Column(String(10), nullable=True)
    apartment = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)

    type = Column(String(50), nullable=False)
    base_rent_amount = Column(Numeric(10, 2), nullable=False)
    lease_start_date = Column(Date, nullable=True)

    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="property_units")
    leases = relationship(
        "Lease",
        back_populates="property_unit",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def get_active_lease(self) -> "Lease | None":
        """Get the currently active lease for this property."""
        if not self.leases:
            return None
        for lease in self.leases:
            if lease.is_active():
                return lease
        return None

    def get_full_address(self) -> str:
        """Build full address from structured fields or return legacy address."""
        if not self.street:
            return self.address

        parts = [self.street]
        if self.street_number:
            parts[0] = f"{self.street} {self.street_number}"
        if self.floor:
            parts.append(f"Piso {self.floor}")
        if self.apartment:
            parts.append(f"Depto {self.apartment}")
        if self.city:
            parts.append(self.city)
        if self.province:
            parts.append(self.province)

        result = ", ".join(parts)
        if self.postal_code:
            result = f"{result} ({self.postal_code})"
        return result
