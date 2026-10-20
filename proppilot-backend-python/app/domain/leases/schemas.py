from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.leases.models import AdjustmentIndex, LeaseStatus


class LeaseBase(BaseModel):
    start_date: date = Field(..., alias="startDate")
    end_date: date = Field(..., alias="endDate")
    monthly_rent: Decimal = Field(..., gt=0, alias="monthlyRent")
    status: LeaseStatus | None = LeaseStatus.ACTIVE
    adjustment_index: AdjustmentIndex | None = Field(AdjustmentIndex.ICL, alias="adjustmentIndex")
    adjustment_frequency_months: int | None = Field(12, alias="adjustmentFrequencyMonths")
    country_code: str | None = Field("AR", alias="countryCode")


class LeaseCreate(LeaseBase):
    model_config = ConfigDict(populate_by_name=True)

    property_unit_id: int = Field(..., alias="propertyUnitId")
    tenant_ids: list[int] = Field(..., alias="tenantIds")


class LeaseUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    start_date: date | None = Field(None, alias="startDate")
    end_date: date | None = Field(None, alias="endDate")
    monthly_rent: Decimal | None = Field(None, gt=0, alias="monthlyRent")
    status: LeaseStatus | None = None
    adjustment_index: AdjustmentIndex | None = Field(None, alias="adjustmentIndex")
    adjustment_frequency_months: int | None = Field(None, alias="adjustmentFrequencyMonths")
    country_code: str | None = Field(None, alias="countryCode")


class LeaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    startDate: date = Field(validation_alias="start_date")
    endDate: date = Field(validation_alias="end_date")
    monthlyRent: Decimal = Field(validation_alias="monthly_rent")
    status: LeaseStatus
    adjustmentIndex: AdjustmentIndex | None = Field(validation_alias="adjustment_index")
    adjustmentFrequencyMonths: int | None = Field(validation_alias="adjustment_frequency_months")
    countryCode: str | None = Field(validation_alias="country_code")
    deleted: bool = False
    deletedAt: datetime | None = Field(None, validation_alias="deleted_at")

    # Computed fields
    propertyUnitId: int | None = None
    propertyUnitIdRef: int | None = None
    propertyAddress: str | None = None
    propertyType: str | None = None
    tenantIdRefs: list[int] = []
    tenantIdRef: int | None = None  # First tenant for backward compat
    tenantNames: list[str] = []
    tenantName: str | None = None  # First tenant for backward compat
    tenantEmails: list[str] = []
    tenantPhones: list[str] = []
    payments: list[dict[str, Any]] = []

    @classmethod
    def from_orm_with_computed(cls, lease) -> "LeaseResponse":
        """Create response with computed fields from ORM model."""
        first_tenant = lease.get_first_tenant()

        # Build payments list
        payments = []
        if lease.payments:
            for payment in lease.payments:
                payments.append({
                    "id": payment.id,
                    "amount": float(payment.amount) if payment.amount else None,
                    "paymentDate": payment.payment_date.isoformat() if payment.payment_date else None,
                    "paymentType": payment.payment_type or None,
                    "status": payment.status or None,
                    "description": payment.description,
                })

        return cls(
            id=lease.id,
            startDate=lease.start_date,
            endDate=lease.end_date,
            monthlyRent=lease.monthly_rent,
            status=lease.status,
            adjustmentIndex=lease.adjustment_index,
            adjustmentFrequencyMonths=lease.adjustment_frequency_months,
            countryCode=lease.country_code,
            deleted=lease.deleted,
            deletedAt=lease.deleted_at,
            propertyUnitId=lease.property_unit.id if lease.property_unit else None,
            propertyUnitIdRef=lease.property_unit.id if lease.property_unit else None,
            propertyAddress=lease.property_unit.address if lease.property_unit else None,
            propertyType=lease.property_unit.type if lease.property_unit else None,
            tenantIdRefs=[t.id for t in lease.tenants] if lease.tenants else [],
            tenantIdRef=first_tenant.id if first_tenant else None,
            tenantNames=lease.get_tenant_names(),
            tenantName=first_tenant.full_name if first_tenant else None,
            tenantEmails=lease.get_tenant_emails(),
            tenantPhones=lease.get_tenant_phones(),
            payments=payments,
        )


class AdjustedRentResponse(BaseModel):
    leaseId: int
    baseRent: Decimal
    adjustmentIndex: str
    leaseStartDate: date
    paymentDate: date
    adjustedRent: Decimal
    adjustmentFactor: float
    message: str | None = None
    indexAtLeaseStart: Decimal | None = None
    indexDateAtLeaseStart: date | None = None
    indexAtPaymentDate: Decimal | None = None
    indexDateAtPaymentDate: date | None = None
