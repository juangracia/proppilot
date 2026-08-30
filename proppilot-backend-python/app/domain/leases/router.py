from datetime import date

from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUserId, DbSession
from app.domain.leases.models import AdjustmentIndex
from app.domain.leases.schemas import (
    AdjustedRentResponse,
    LeaseCreate,
    LeaseResponse,
    LeaseUpdate,
)
from app.domain.leases.service import LeaseService

router = APIRouter()


@router.post("", response_model=LeaseResponse, status_code=status.HTTP_201_CREATED)
async def create_lease(
    data: LeaseCreate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Create a new lease."""
    service = LeaseService(db)
    lease = await service.create(data, owner_id)
    return LeaseResponse.from_orm_with_computed(lease)


@router.get("", response_model=list[LeaseResponse])
async def get_all_leases(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all leases for the current user."""
    service = LeaseService(db)
    leases = await service.get_all(owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/active", response_model=list[LeaseResponse])
async def get_active_leases(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all active leases."""
    service = LeaseService(db)
    leases = await service.get_active(owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/deleted", response_model=list[LeaseResponse])
async def get_deleted_leases(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all soft-deleted leases."""
    service = LeaseService(db)
    leases = await service.get_deleted(owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/property-unit/{property_unit_id}", response_model=list[LeaseResponse])
async def get_leases_by_property_unit(
    property_unit_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all leases for a property unit."""
    service = LeaseService(db)
    leases = await service.get_by_property_unit(property_unit_id, owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/property-unit/{property_unit_id}/active", response_model=LeaseResponse | None)
async def get_active_lease_by_property_unit(
    property_unit_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get the active lease for a property unit."""
    service = LeaseService(db)
    lease = await service.get_active_by_property_unit(property_unit_id, owner_id)
    if lease:
        return LeaseResponse.from_orm_with_computed(lease)
    return None


@router.get("/tenant/{tenant_id}", response_model=list[LeaseResponse])
async def get_leases_by_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all leases for a tenant."""
    service = LeaseService(db)
    leases = await service.get_by_tenant(tenant_id, owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/tenant/{tenant_id}/active", response_model=list[LeaseResponse])
async def get_active_leases_by_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get active leases for a tenant."""
    service = LeaseService(db)
    leases = await service.get_active_by_tenant(tenant_id, owner_id)
    return [LeaseResponse.from_orm_with_computed(l) for l in leases]


@router.get("/{lease_id}", response_model=LeaseResponse)
async def get_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get a lease by ID."""
    service = LeaseService(db)
    lease = await service.get_by_id(lease_id, owner_id)
    return LeaseResponse.from_orm_with_computed(lease)


@router.put("/{lease_id}", response_model=LeaseResponse)
async def update_lease(
    lease_id: int,
    data: LeaseUpdate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Update a lease."""
    service = LeaseService(db)
    lease = await service.update(lease_id, data, owner_id)
    return LeaseResponse.from_orm_with_computed(lease)


@router.post("/{lease_id}/terminate", status_code=status.HTTP_200_OK)
async def terminate_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Terminate a lease."""
    service = LeaseService(db)
    await service.terminate(lease_id, owner_id)
    return {"message": "Lease terminated successfully"}


@router.post("/{lease_id}/reactivate", status_code=status.HTTP_200_OK)
async def reactivate_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Reactivate a terminated lease."""
    service = LeaseService(db)
    await service.reactivate(lease_id, owner_id)
    return {"message": "Lease reactivated successfully"}


@router.delete("/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Soft delete a lease."""
    service = LeaseService(db)
    await service.soft_delete(lease_id, owner_id)


@router.post("/{lease_id}/restore", status_code=status.HTTP_200_OK)
async def restore_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Restore a soft-deleted lease."""
    service = LeaseService(db)
    await service.restore(lease_id, owner_id)
    return {"message": "Lease restored successfully"}


@router.delete("/{lease_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanently_delete_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Permanently delete a soft-deleted lease."""
    service = LeaseService(db)
    await service.permanently_delete(lease_id, owner_id)


@router.get("/{lease_id}/adjusted-rent")
async def get_adjusted_rent(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
    payment_date: date | None = Query(None, alias="paymentDate"),
):
    """Calculate adjusted rent for a lease based on the adjustment index."""
    service = LeaseService(db)
    lease = await service.get_by_id(lease_id, owner_id)

    effective_date = payment_date or date.today()
    country_code = lease.country_code or "AR"
    adjustment_index = lease.adjustment_index

    # adjustment_index may be a string or enum depending on how it was loaded
    adjustment_index_str = adjustment_index.value if hasattr(adjustment_index, 'value') else adjustment_index

    result = {
        "leaseId": lease.id,
        "baseRent": float(lease.monthly_rent),
        "adjustmentIndex": adjustment_index_str if adjustment_index_str else "NONE",
        "leaseStartDate": lease.start_date.isoformat(),
        "paymentDate": effective_date.isoformat(),
    }

    if adjustment_index is None or adjustment_index_str == "NONE":
        result["adjustedRent"] = float(lease.monthly_rent)
        result["adjustmentFactor"] = 1.0
        result["message"] = "No adjustment index configured for this lease"
    else:
        # TODO: Integrate with IndexValueService when implemented
        # For now, return base rent
        result["adjustedRent"] = float(lease.monthly_rent)
        result["adjustmentFactor"] = 1.0
        result["message"] = "Index calculation will be implemented with IndexValueService"

    return result
