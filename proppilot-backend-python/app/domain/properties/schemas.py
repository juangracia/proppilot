from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PropertyUnitBase(BaseModel):
    address: str | None = Field(None, max_length=255)
    street: str | None = Field(None, max_length=150)
    street_number: str | None = Field(None, max_length=20, alias="streetNumber")
    floor: str | None = Field(None, max_length=10)
    apartment: str | None = Field(None, max_length=20)
    city: str | None = Field(None, max_length=100)
    province: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20, alias="postalCode")
    type: str = Field(..., min_length=2, max_length=50)
    base_rent_amount: Decimal = Field(..., gt=0, alias="baseRentAmount")
    lease_start_date: date | None = Field(None, alias="leaseStartDate")

    def compute_address(self) -> str:
        """Compute full address from structured fields."""
        parts = []
        if self.street:
            addr = self.street
            if self.street_number:
                addr += f" {self.street_number}"
            parts.append(addr)
        if self.floor:
            parts.append(f"Piso {self.floor}")
        if self.apartment:
            parts.append(f"Depto {self.apartment}")
        if self.city:
            parts.append(self.city)
        if self.province:
            parts.append(self.province)
        return ", ".join(parts) if parts else "Sin dirección"


class PropertyUnitCreate(PropertyUnitBase):
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("address", mode="before")
    @classmethod
    def set_address_if_none(cls, v, info):
        """Address will be computed after model validation if not provided."""
        return v


class PropertyUnitUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    address: str | None = Field(None, max_length=255)
    street: str | None = Field(None, max_length=150)
    street_number: str | None = Field(None, max_length=20, alias="streetNumber")
    floor: str | None = Field(None, max_length=10)
    apartment: str | None = Field(None, max_length=20)
    city: str | None = Field(None, max_length=100)
    province: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20, alias="postalCode")
    type: str | None = Field(None, min_length=2, max_length=50)
    base_rent_amount: Decimal | None = Field(None, gt=0, alias="baseRentAmount")
    lease_start_date: date | None = Field(None, alias="leaseStartDate")


class PropertyUnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    address: str
    street: str | None = None
    streetNumber: str | None = Field(None, validation_alias="street_number")
    floor: str | None = None
    apartment: str | None = None
    city: str | None = None
    province: str | None = None
    postalCode: str | None = Field(None, validation_alias="postal_code")
    type: str
    baseRentAmount: Decimal = Field(validation_alias="base_rent_amount")
    leaseStartDate: date | None = Field(None, validation_alias="lease_start_date")

    # Computed fields from relationships
    fullAddress: str | None = None
    currentTenantName: str | None = None
    currentTenantId: int | None = None
    activeLeaseId: int | None = None
    payments: list[dict[str, Any]] = []

    @classmethod
    def from_orm_with_computed(cls, property_unit) -> "PropertyUnitResponse":
        """Create response with computed fields from ORM model."""
        active_lease = property_unit.get_active_lease()

        # Build payments list from all leases
        payments = []
        if property_unit.leases:
            for lease in property_unit.leases:
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
            # Sort by date descending
            payments.sort(key=lambda x: x.get("paymentDate") or "", reverse=True)

        return cls(
            id=property_unit.id,
            address=property_unit.address,
            street=property_unit.street,
            streetNumber=property_unit.street_number,
            floor=property_unit.floor,
            apartment=property_unit.apartment,
            city=property_unit.city,
            province=property_unit.province,
            postalCode=property_unit.postal_code,
            type=property_unit.type,
            baseRentAmount=property_unit.base_rent_amount,
            leaseStartDate=property_unit.lease_start_date,
            fullAddress=property_unit.get_full_address(),
            currentTenantName=active_lease.get_first_tenant().full_name if active_lease and active_lease.get_first_tenant() else None,
            currentTenantId=active_lease.get_first_tenant().id if active_lease and active_lease.get_first_tenant() else None,
            activeLeaseId=active_lease.id if active_lease else None,
            payments=payments,
        )


class CanDeleteResponse(BaseModel):
    canDelete: bool
    reason: str | None = None
    leaseCount: int = 0
