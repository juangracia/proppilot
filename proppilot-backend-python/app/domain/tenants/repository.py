from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.leases.models import Lease, lease_tenants
from app.domain.tenants.models import Tenant


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, tenant: Tenant) -> Tenant:
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def get_by_id(self, tenant_id: int) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant)
            .options(selectinload(Tenant.leases).selectinload(Lease.property_unit))
            .where(Tenant.id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_owner(self, tenant_id: int, owner_id: int) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant)
            .options(selectinload(Tenant.leases).selectinload(Lease.property_unit))
            .where(Tenant.id == tenant_id, Tenant.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int) -> list[Tenant]:
        result = await self.db.execute(
            select(Tenant)
            .options(selectinload(Tenant.leases).selectinload(Lease.property_unit))
            .where(Tenant.owner_id == owner_id)
            .order_by(Tenant.id)
        )
        return list(result.scalars().all())

    async def get_by_national_id(self, national_id: str) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant).where(Tenant.national_id == national_id)
        )
        return result.scalar_one_or_none()

    async def get_by_national_id_and_owner(
        self, national_id: str, owner_id: int
    ) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant)
            .options(selectinload(Tenant.leases).selectinload(Lease.property_unit))
            .where(Tenant.national_id == national_id, Tenant.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.email == email))
        return result.scalar_one_or_none()

    async def get_by_email_and_owner(self, email: str, owner_id: int) -> Tenant | None:
        result = await self.db.execute(
            select(Tenant)
            .options(selectinload(Tenant.leases).selectinload(Lease.property_unit))
            .where(Tenant.email == email, Tenant.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def update(self, tenant: Tenant) -> Tenant:
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def delete(self, tenant: Tenant) -> None:
        await self.db.delete(tenant)
        await self.db.flush()

    async def count_leases(self, tenant_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(lease_tenants)
            .join(Lease, Lease.id == lease_tenants.c.lease_id)
            .where(lease_tenants.c.tenant_id == tenant_id, Lease.deleted == False)
        )
        return result.scalar() or 0
