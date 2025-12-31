from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUserId, DbSession
from app.domain.tenants.schemas import (
    CanDeleteResponse,
    TenantCreate,
    TenantResponse,
    TenantUpdate,
)
from app.domain.tenants.service import TenantService

router = APIRouter()


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Create a new tenant."""
    service = TenantService(db)
    tenant = await service.create(data, owner_id)
    return TenantResponse.from_orm_with_computed(tenant)


@router.get("", response_model=list[TenantResponse])
async def get_all_tenants(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all tenants for the current user."""
    service = TenantService(db)
    tenants = await service.get_all(owner_id)
    return [TenantResponse.from_orm_with_computed(t) for t in tenants]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get a tenant by ID."""
    service = TenantService(db)
    tenant = await service.get_by_id(tenant_id, owner_id)
    return TenantResponse.from_orm_with_computed(tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    data: TenantUpdate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Update a tenant."""
    service = TenantService(db)
    tenant = await service.update(tenant_id, data, owner_id)
    return TenantResponse.from_orm_with_computed(tenant)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Delete a tenant."""
    service = TenantService(db)
    await service.delete(tenant_id, owner_id)


@router.get("/search/national-id/{national_id}", response_model=TenantResponse)
async def get_tenant_by_national_id(
    national_id: str,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Find tenant by national ID."""
    service = TenantService(db)
    tenant = await service.get_by_national_id(national_id, owner_id)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return TenantResponse.from_orm_with_computed(tenant)


@router.get("/search/email/{email}", response_model=TenantResponse)
async def get_tenant_by_email(
    email: str,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Find tenant by email."""
    service = TenantService(db)
    tenant = await service.get_by_email(email, owner_id)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return TenantResponse.from_orm_with_computed(tenant)


@router.get("/{tenant_id}/can-delete", response_model=CanDeleteResponse)
async def can_delete_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Check if a tenant can be deleted."""
    service = TenantService(db)
    result = await service.can_delete(tenant_id, owner_id)
    return CanDeleteResponse(**result)
