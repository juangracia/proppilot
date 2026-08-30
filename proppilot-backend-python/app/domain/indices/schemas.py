from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.indices.models import IndexType


class IndexValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    indexType: IndexType = Field(validation_alias="index_type")
    countryCode: str = Field(validation_alias="country_code")
    valueDate: date = Field(validation_alias="value_date")
    value: Decimal
    source: str


class AdjustmentFactorResponse(BaseModel):
    country: str
    indexType: IndexType
    fromDate: date
    toDate: date
    factor: Decimal


class AnnualChangeResponse(BaseModel):
    indexType: IndexType
    annualChangePercent: Decimal


class MonthlyChangeResponse(BaseModel):
    indexType: IndexType
    monthlyChangePercent: Decimal
