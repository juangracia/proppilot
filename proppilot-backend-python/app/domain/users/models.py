from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    picture_url = Column(String(500), nullable=True)
    provider = Column(String(50), nullable=False)
    provider_id = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    property_units = relationship("PropertyUnit", back_populates="owner", lazy="dynamic")
    tenants = relationship("Tenant", back_populates="owner", lazy="dynamic")
    leases = relationship("Lease", back_populates="owner", lazy="dynamic")
    payments = relationship("Payment", back_populates="owner", lazy="dynamic")
