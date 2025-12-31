from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantBase(BaseModel):
    full_name: str = Field(..., min_length=1, alias="fullName")
    national_id: str = Field(..., min_length=1, alias="nationalId")
    email: EmailStr
    phone: str = Field(..., min_length=1)


class TenantCreate(TenantBase):
    model_config = ConfigDict(populate_by_name=True)


class TenantUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str | None = Field(None, min_length=1, alias="fullName")
    national_id: str | None = Field(None, min_length=1, alias="nationalId")
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=1)


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    fullName: str = Field(validation_alias="full_name")
    nationalId: str = Field(validation_alias="national_id")
    email: str
    phone: str

    # Computed fields from active lease
    property: str | None = None
    propertyId: int | None = None
    monthlyRent: Decimal | None = None
    leaseStart: date | None = None
    leaseEndDate: date | None = None
    activeLeaseId: int | None = None

    @classmethod
    def from_orm_with_computed(cls, tenant) -> "TenantResponse":
        """Create response with computed fields from ORM model."""
        active_lease = tenant.get_active_lease()

        return cls(
            id=tenant.id,
            fullName=tenant.full_name,
            nationalId=tenant.national_id,
            email=tenant.email,
            phone=tenant.phone,
            property=active_lease.property_unit.address if active_lease and active_lease.property_unit else None,
            propertyId=active_lease.property_unit.id if active_lease and active_lease.property_unit else None,
            monthlyRent=active_lease.monthly_rent if active_lease else None,
            leaseStart=active_lease.start_date if active_lease else None,
            leaseEndDate=active_lease.end_date if active_lease else None,
            activeLeaseId=active_lease.id if active_lease else None,
        )


class CanDeleteResponse(BaseModel):
    canDelete: bool
    reason: str | None = None
    leaseCount: int = 0
