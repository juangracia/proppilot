import enum
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Column, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.domain.leases.models import Lease
    from app.domain.users.models import User


class PaymentType(str, enum.Enum):
    RENT = "RENT"
    DEPOSIT = "DEPOSIT"
    MAINTENANCE = "MAINTENANCE"
    UTILITY = "UTILITY"
    OTHER = "OTHER"


class PaymentStatus(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    lease_id = Column(BigInteger, ForeignKey("leases.id"), nullable=False)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)

    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)

    # Stored as VARCHAR with CHECK constraint
    payment_type = Column(String(255), nullable=False, default="RENT")
    description = Column(String(500), nullable=True)
    status = Column(String(255), nullable=False, default="PAID")

    # Index tracking fields
    index_type = Column(String(20), nullable=True)
    index_value_at_payment = Column(Numeric(18, 6), nullable=True)
    index_date = Column(Date, nullable=True)

    # Relationships
    lease = relationship("Lease", back_populates="payments", lazy="selectin")
    owner = relationship("User", back_populates="payments", lazy="selectin")
