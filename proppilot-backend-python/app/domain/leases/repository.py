from datetime import date

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.leases.models import Lease, LeaseStatus, lease_tenants


class LeaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self):
        return select(Lease).options(
            selectinload(Lease.property_unit),
            selectinload(Lease.tenants),
            selectinload(Lease.payments),
        )

    async def create(self, lease: Lease) -> Lease:
        self.db.add(lease)
        await self.db.flush()
        await self.db.refresh(lease)
        return lease

    async def get_by_id_and_owner(self, lease_id: int, owner_id: int) -> Lease | None:
        result = await self.db.execute(
            self._base_query().where(
                Lease.id == lease_id,
                Lease.owner_id == owner_id,
                Lease.deleted == False,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_owner_deleted(self, lease_id: int, owner_id: int) -> Lease | None:
        result = await self.db.execute(
            self._base_query().where(
                Lease.id == lease_id,
                Lease.owner_id == owner_id,
                Lease.deleted == True,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int) -> list[Lease]:
        result = await self.db.execute(
            self._base_query()
            .where(Lease.owner_id == owner_id, Lease.deleted == False)
            .order_by(Lease.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_deleted_by_owner(self, owner_id: int) -> list[Lease]:
        result = await self.db.execute(
            self._base_query()
            .where(Lease.owner_id == owner_id, Lease.deleted == True)
            .order_by(Lease.deleted_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_owner(self, owner_id: int, as_of_date: date) -> list[Lease]:
        result = await self.db.execute(
            self._base_query().where(
                Lease.owner_id == owner_id,
                Lease.deleted == False,
                Lease.status == LeaseStatus.ACTIVE,
                Lease.start_date <= as_of_date,
                Lease.end_date >= as_of_date,
            )
        )
        return list(result.scalars().all())

    async def get_by_property_unit(self, property_unit_id: int, owner_id: int) -> list[Lease]:
        result = await self.db.execute(
            self._base_query()
            .where(
                Lease.property_unit_id == property_unit_id,
                Lease.owner_id == owner_id,
                Lease.deleted == False,
            )
            .order_by(Lease.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_property_unit(
        self, property_unit_id: int, owner_id: int, as_of_date: date
    ) -> Lease | None:
        result = await self.db.execute(
            self._base_query().where(
                Lease.property_unit_id == property_unit_id,
                Lease.owner_id == owner_id,
                Lease.deleted == False,
                Lease.status == LeaseStatus.ACTIVE,
                Lease.start_date <= as_of_date,
                Lease.end_date >= as_of_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_tenant(self, tenant_id: int, owner_id: int) -> list[Lease]:
        result = await self.db.execute(
            self._base_query()
            .join(lease_tenants)
            .where(
                lease_tenants.c.tenant_id == tenant_id,
                Lease.owner_id == owner_id,
                Lease.deleted == False,
            )
            .order_by(Lease.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_tenant(
        self, tenant_id: int, owner_id: int, as_of_date: date
    ) -> list[Lease]:
        result = await self.db.execute(
            self._base_query()
            .join(lease_tenants)
            .where(
                lease_tenants.c.tenant_id == tenant_id,
                Lease.owner_id == owner_id,
                Lease.deleted == False,
                Lease.status == LeaseStatus.ACTIVE,
                Lease.start_date <= as_of_date,
                Lease.end_date >= as_of_date,
            )
        )
        return list(result.scalars().all())

    async def update(self, lease: Lease) -> Lease:
        await self.db.flush()
        await self.db.refresh(lease)
        return lease

    async def delete(self, lease: Lease) -> None:
        await self.db.delete(lease)
        await self.db.flush()

    async def has_overlapping_lease(
        self,
        property_unit_id: int,
        start_date: date,
        end_date: date,
        exclude_lease_id: int | None = None,
    ) -> bool:
        conditions = [
            Lease.property_unit_id == property_unit_id,
            Lease.status == LeaseStatus.ACTIVE,
            Lease.deleted == False,
            Lease.start_date <= end_date,
            Lease.end_date >= start_date,
        ]
        if exclude_lease_id:
            conditions.append(Lease.id != exclude_lease_id)

        result = await self.db.execute(
            select(func.count()).select_from(Lease).where(and_(*conditions))
        )
        return (result.scalar() or 0) > 0

    async def count_by_property_unit(self, property_unit_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Lease)
            .where(Lease.property_unit_id == property_unit_id, Lease.deleted == False)
        )
        return result.scalar() or 0

    async def count_by_tenant(self, tenant_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(lease_tenants)
            .join(Lease, Lease.id == lease_tenants.c.lease_id)
            .where(lease_tenants.c.tenant_id == tenant_id, Lease.deleted == False)
        )
        return result.scalar() or 0
