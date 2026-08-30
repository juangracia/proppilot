import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)

from app.database import Base


class IndexType(str, enum.Enum):
    ICL = "ICL"
    IPC = "IPC"
    DOLAR_BLUE = "DOLAR_BLUE"
    DOLAR_OFICIAL = "DOLAR_OFICIAL"
    DOLAR_MEP = "DOLAR_MEP"
    NONE = "NONE"


class IndexValue(Base):
    __tablename__ = "index_values"
    __table_args__ = (
        UniqueConstraint(
            "index_type", "country_code", "value_date", name="uk_index_country_date"
        ),
        Index("idx_index_values_type", "index_type"),
        Index("idx_index_values_date", "value_date"),
        Index("idx_index_values_country", "country_code"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    # Stored as VARCHAR with CHECK constraint
    index_type = Column(String(20), nullable=False)
    country_code = Column(String(2), nullable=False)
    value_date = Column(Date, nullable=False)
    value = Column(Numeric(18, 6), nullable=False)
    source = Column(String(100), nullable=False)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
