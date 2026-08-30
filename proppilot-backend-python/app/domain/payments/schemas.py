from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domain.payments.models import PaymentStatus, PaymentType


class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_date: date = Field(..., alias="paymentDate")
    payment_type: PaymentType = Field(PaymentType.RENT, alias="paymentType")
    description: str | None = Field(None, max_length=500)
    status: PaymentStatus = PaymentStatus.PAID


class PaymentCreate(PaymentBase):
    model_config = ConfigDict(populate_by_name=True)

    lease_id: int = Field(..., alias="leaseId")


class PaymentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    amount: Decimal | None = Field(None, gt=0)
    payment_date: date | None = Field(None, alias="paymentDate")
    payment_type: PaymentType | None = Field(None, alias="paymentType")
    description: str | None = Field(None, max_length=500)
    status: PaymentStatus | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    amount: Decimal
    paymentDate: date = Field(validation_alias="payment_date")
    paymentType: PaymentType = Field(validation_alias="payment_type")
    description: str | None = None
    status: PaymentStatus

    # Index tracking fields
    indexType: str | None = Field(None, validation_alias="index_type")
    indexValueAtPayment: Decimal | None = Field(None, validation_alias="index_value_at_payment")
    indexDate: date | None = Field(None, validation_alias="index_date")

    # Computed fields from relationships
    leaseId: int | None = None
    leaseIdRef: int | None = None
    propertyUnitId: int | None = None
    propertyAddress: str | None = None
    tenantId: int | None = None  # First tenant for backward compat
    tenantIds: list[int] = []
    tenantName: str | None = None  # First tenant for backward compat
    tenantNames: list[str] = []
    leaseStartDate: date | None = None
    leaseEndDate: date | None = None
    monthlyRent: Decimal | None = None

    @classmethod
    def from_orm_with_computed(cls, payment) -> "PaymentResponse":
        """Create response with computed fields from ORM model."""
        lease = payment.lease
        first_tenant = lease.get_first_tenant() if lease else None

        return cls(
            id=payment.id,
            amount=payment.amount,
            paymentDate=payment.payment_date,
            paymentType=payment.payment_type,
            description=payment.description,
            status=payment.status,
            indexType=payment.index_type,
            indexValueAtPayment=payment.index_value_at_payment,
            indexDate=payment.index_date,
            leaseId=lease.id if lease else None,
            leaseIdRef=lease.id if lease else None,
            propertyUnitId=lease.property_unit.id if lease and lease.property_unit else None,
            propertyAddress=lease.property_unit.address if lease and lease.property_unit else None,
            tenantId=first_tenant.id if first_tenant else None,
            tenantIds=[t.id for t in lease.tenants] if lease and lease.tenants else [],
            tenantName=first_tenant.full_name if first_tenant else None,
            tenantNames=[t.full_name for t in lease.tenants] if lease and lease.tenants else [],
            leaseStartDate=lease.start_date if lease else None,
            leaseEndDate=lease.end_date if lease else None,
            monthlyRent=lease.monthly_rent if lease else None,
        )
