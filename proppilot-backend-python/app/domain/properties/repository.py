from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.leases.models import Lease
from app.domain.properties.models import PropertyUnit


class PropertyUnitRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, property_unit: PropertyUnit) -> PropertyUnit:
        self.db.add(property_unit)
        await self.db.flush()
        await self.db.refresh(property_unit)
        return property_unit

    async def get_by_id(self, property_id: int) -> PropertyUnit | None:
        result = await self.db.execute(
            select(PropertyUnit)
            .options(
                selectinload(PropertyUnit.leases).selectinload(Lease.tenants),
                selectinload(PropertyUnit.leases).selectinload(Lease.payments),
            )
            .where(PropertyUnit.id == property_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_owner(self, property_id: int, owner_id: int) -> PropertyUnit | None:
        result = await self.db.execute(
            select(PropertyUnit)
            .options(
                selectinload(PropertyUnit.leases).selectinload(Lease.tenants),
                selectinload(PropertyUnit.leases).selectinload(Lease.payments),
            )
            .where(PropertyUnit.id == property_id, PropertyUnit.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int) -> list[PropertyUnit]:
        result = await self.db.execute(
            select(PropertyUnit)
            .options(
                selectinload(PropertyUnit.leases).selectinload(Lease.tenants),
                selectinload(PropertyUnit.leases).selectinload(Lease.payments),
            )
            .where(PropertyUnit.owner_id == owner_id)
            .order_by(PropertyUnit.id)
        )
        return list(result.scalars().all())

    async def get_all_with_leases(self, owner_id: int) -> list[PropertyUnit]:
        result = await self.db.execute(
            select(PropertyUnit)
            .options(
                selectinload(PropertyUnit.leases).selectinload(Lease.tenants),
                selectinload(PropertyUnit.leases).selectinload(Lease.payments),
            )
            .where(PropertyUnit.owner_id == owner_id)
            .order_by(PropertyUnit.id)
        )
        return list(result.scalars().all())

    async def search_by_address(self, address: str, owner_id: int) -> list[PropertyUnit]:
        result = await self.db.execute(
            select(PropertyUnit)
            .options(
                selectinload(PropertyUnit.leases).selectinload(Lease.tenants),
                selectinload(PropertyUnit.leases).selectinload(Lease.payments),
            )
            .where(
                PropertyUnit.owner_id == owner_id,
                PropertyUnit.address.ilike(f"%{address}%"),
            )
            .order_by(PropertyUnit.id)
        )
        return list(result.scalars().all())

    async def update(self, property_unit: PropertyUnit) -> PropertyUnit:
        await self.db.flush()
        await self.db.refresh(property_unit)
        return property_unit

    async def delete(self, property_unit: PropertyUnit) -> None:
        await self.db.delete(property_unit)
        await self.db.flush()

    async def count_leases(self, property_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Lease)
            .where(Lease.property_unit_id == property_id, Lease.deleted == False)
        )
        return result.scalar() or 0
