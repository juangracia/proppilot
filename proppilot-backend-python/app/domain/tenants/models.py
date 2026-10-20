from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.domain.leases.models import Lease
    from app.domain.users.models import User


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    national_id = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)

    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="tenants")
    leases = relationship(
        "Lease",
        secondary="lease_tenants",
        back_populates="tenants",
        lazy="selectin",
    )

    def get_active_lease(self) -> "Lease | None":
        """Get the currently active lease for this tenant."""
        if not self.leases:
            return None
        for lease in self.leases:
            if lease.is_active():
                return lease
        return None
