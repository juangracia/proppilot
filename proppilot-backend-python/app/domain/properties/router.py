from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUserId, DbSession
from app.domain.properties.schemas import (
    CanDeleteResponse,
    PropertyUnitCreate,
    PropertyUnitResponse,
    PropertyUnitUpdate,
)
from app.domain.properties.service import PropertyUnitService

router = APIRouter()


@router.post("", response_model=PropertyUnitResponse, status_code=status.HTTP_201_CREATED)
async def create_property_unit(
    data: PropertyUnitCreate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Create a new property unit."""
    service = PropertyUnitService(db)
    property_unit = await service.create(data, owner_id)
    return PropertyUnitResponse.from_orm_with_computed(property_unit)


@router.get("/{property_id}", response_model=PropertyUnitResponse)
async def get_property_unit(
    property_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get a property unit by ID."""
    service = PropertyUnitService(db)
    property_unit = await service.get_by_id(property_id, owner_id)
    return PropertyUnitResponse.from_orm_with_computed(property_unit)


@router.get("", response_model=list[PropertyUnitResponse])
async def get_all_property_units(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all property units for the current user."""
    service = PropertyUnitService(db)
    properties = await service.get_all(owner_id)
    return [PropertyUnitResponse.from_orm_with_computed(p) for p in properties]


@router.get("/with-leases", response_model=list[PropertyUnitResponse])
async def get_all_property_units_with_leases(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all property units with their associated leases."""
    service = PropertyUnitService(db)
    properties = await service.get_all_with_leases(owner_id)
    return [PropertyUnitResponse.from_orm_with_computed(p) for p in properties]


@router.get("/search", response_model=list[PropertyUnitResponse])
async def search_property_units(
    address: str = Query(..., description="Address to search for"),
    db: DbSession = None,
    owner_id: CurrentUserId = None,
):
    """Search property units by address."""
    service = PropertyUnitService(db)
    properties = await service.search(address, owner_id)
    return [PropertyUnitResponse.from_orm_with_computed(p) for p in properties]


@router.put("/{property_id}", response_model=PropertyUnitResponse)
async def update_property_unit(
    property_id: int,
    data: PropertyUnitUpdate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Update a property unit."""
    service = PropertyUnitService(db)
    property_unit = await service.update(property_id, data, owner_id)
    return PropertyUnitResponse.from_orm_with_computed(property_unit)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property_unit(
    property_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Delete a property unit."""
    service = PropertyUnitService(db)
    await service.delete(property_id, owner_id)


@router.get("/{property_id}/can-delete", response_model=CanDeleteResponse)
async def can_delete_property_unit(
    property_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Check if a property unit can be deleted."""
    service = PropertyUnitService(db)
    result = await service.can_delete(property_id, owner_id)
    return CanDeleteResponse(**result)
