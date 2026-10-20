from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BusinessLogicException,
    DuplicateResourceException,
    ResourceNotFoundException,
)
from app.domain.tenants.models import Tenant
from app.domain.tenants.repository import TenantRepository
from app.domain.tenants.schemas import TenantCreate, TenantUpdate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TenantRepository(db)

    async def create(self, data: TenantCreate, owner_id: int) -> Tenant:
        # Check for duplicate national ID
        existing = await self.repo.get_by_national_id(data.national_id)
        if existing:
            raise DuplicateResourceException("Tenant", "national ID", data.national_id)

        # Check for duplicate email
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise DuplicateResourceException("Tenant", "email", data.email)

        tenant = Tenant(
            full_name=data.full_name,
            national_id=data.national_id,
            email=data.email,
            phone=data.phone,
            owner_id=owner_id,
        )
        return await self.repo.create(tenant)

    async def get_all(self, owner_id: int) -> list[Tenant]:
        return await self.repo.get_all_by_owner(owner_id)

    async def get_by_id(self, tenant_id: int, owner_id: int) -> Tenant:
        tenant = await self.repo.get_by_id_and_owner(tenant_id, owner_id)
        if tenant is None:
            raise ResourceNotFoundException("Tenant", tenant_id)
        return tenant

    async def get_by_national_id(self, national_id: str, owner_id: int) -> Tenant | None:
        return await self.repo.get_by_national_id_and_owner(national_id, owner_id)

    async def get_by_email(self, email: str, owner_id: int) -> Tenant | None:
        return await self.repo.get_by_email_and_owner(email, owner_id)

    async def update(self, tenant_id: int, data: TenantUpdate, owner_id: int) -> Tenant:
        tenant = await self.get_by_id(tenant_id, owner_id)

        # Check if national ID is being changed and ensure uniqueness
        if data.national_id and data.national_id != tenant.national_id:
            existing = await self.repo.get_by_national_id(data.national_id)
            if existing and existing.id != tenant_id:
                raise DuplicateResourceException("Tenant", "national ID", data.national_id)
            tenant.national_id = data.national_id

        # Check if email is being changed and ensure uniqueness
        if data.email and data.email != tenant.email:
            existing = await self.repo.get_by_email(data.email)
            if existing and existing.id != tenant_id:
                raise DuplicateResourceException("Tenant", "email", data.email)
            tenant.email = data.email

        if data.full_name:
            tenant.full_name = data.full_name
        if data.phone:
            tenant.phone = data.phone

        return await self.repo.update(tenant)

    async def delete(self, tenant_id: int, owner_id: int) -> None:
        tenant = await self.get_by_id(tenant_id, owner_id)

        lease_count = await self.repo.count_leases(tenant_id)
        if lease_count > 0:
            raise BusinessLogicException(
                f"No se puede eliminar el inquilino porque tiene {lease_count} contrato(s) activo(s). "
                "Debes eliminar primero los contratos antes de poder eliminar el inquilino."
            )

        await self.repo.delete(tenant)

    async def can_delete(self, tenant_id: int, owner_id: int) -> dict:
        # Verify tenant exists
        await self.get_by_id(tenant_id, owner_id)

        lease_count = await self.repo.count_leases(tenant_id)

        if lease_count > 0:
            return {
                "canDelete": False,
                "reason": f"Este inquilino tiene {lease_count} contrato(s) asociado(s). "
                "Debes eliminar primero los contratos antes de poder eliminar el inquilino.",
                "leaseCount": lease_count,
            }
        else:
            return {
                "canDelete": True,
                "reason": None,
                "leaseCount": 0,
            }
