from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.leases.models import Lease, lease_tenants
from app.domain.payments.models import Payment, PaymentStatus, PaymentType
from app.domain.properties.models import PropertyUnit


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self):
        return select(Payment).options(
            selectinload(Payment.lease).selectinload(Lease.property_unit),
            selectinload(Payment.lease).selectinload(Lease.tenants),
        )

    async def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment

    async def get_by_id_and_owner(self, payment_id: int, owner_id: int) -> Payment | None:
        result = await self.db.execute(
            self._base_query().where(
                Payment.id == payment_id,
                Payment.owner_id == owner_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: int) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .where(Payment.owner_id == owner_id)
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_lease(self, lease_id: int, owner_id: int) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .where(Payment.lease_id == lease_id, Payment.owner_id == owner_id)
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_property_unit(self, property_unit_id: int, owner_id: int) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .join(Lease)
            .where(Lease.property_unit_id == property_unit_id, Payment.owner_id == owner_id)
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_tenant(self, tenant_id: int, owner_id: int) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .join(Lease)
            .join(lease_tenants)
            .where(lease_tenants.c.tenant_id == tenant_id, Payment.owner_id == owner_id)
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_lease_and_status(
        self, lease_id: int, status: PaymentStatus, owner_id: int
    ) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .where(
                Payment.lease_id == lease_id,
                Payment.status == status,
                Payment.owner_id == owner_id,
            )
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_lease_and_date_range(
        self, lease_id: int, start_date: date, end_date: date
    ) -> list[Payment]:
        result = await self.db.execute(
            self._base_query()
            .where(
                Payment.lease_id == lease_id,
                Payment.payment_date >= start_date,
                Payment.payment_date <= end_date,
            )
            .order_by(Payment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def sum_by_lease_and_type(
        self, lease_id: int, payment_type: PaymentType, owner_id: int
    ) -> Decimal:
        result = await self.db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.lease_id == lease_id,
                Payment.payment_type == payment_type,
                Payment.owner_id == owner_id,
            )
        )
        return result.scalar() or Decimal("0")

    async def update(self, payment: Payment) -> Payment:
        await self.db.flush()
        await self.db.refresh(payment)
        return payment

    async def delete(self, payment: Payment) -> None:
        await self.db.delete(payment)
        await self.db.flush()
