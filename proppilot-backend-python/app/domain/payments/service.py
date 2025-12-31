from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessLogicException, ResourceNotFoundException
from app.domain.leases.repository import LeaseRepository
from app.domain.payments.models import Payment, PaymentStatus, PaymentType
from app.domain.payments.repository import PaymentRepository
from app.domain.payments.schemas import PaymentCreate, PaymentUpdate


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PaymentRepository(db)
        self.lease_repo = LeaseRepository(db)

    async def create(self, data: PaymentCreate, owner_id: int) -> Payment:
        # Validate lease exists and belongs to owner
        lease = await self.lease_repo.get_by_id_and_owner(data.lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", data.lease_id)

        # Validate payment date is not before lease start
        if data.payment_date < lease.start_date:
            raise BusinessLogicException("Payment date cannot be before lease start date")

        # Business rule: Payment should not exceed 3 months rent
        max_payment = lease.monthly_rent * 3
        if data.amount > max_payment:
            raise BusinessLogicException(
                "Payment amount cannot exceed 3 months of rent in a single payment"
            )

        payment = Payment(
            lease_id=data.lease_id,
            owner_id=owner_id,
            amount=data.amount,
            payment_date=data.payment_date,
            payment_type=data.payment_type,
            description=data.description,
            status=data.status,
        )

        # TODO: Track index value at payment time when IndexValueService is ready
        # self._track_index_value(payment, lease)

        return await self.repo.create(payment)

    async def get_by_id(self, payment_id: int, owner_id: int) -> Payment:
        payment = await self.repo.get_by_id_and_owner(payment_id, owner_id)
        if payment is None:
            raise ResourceNotFoundException("Payment", payment_id)
        return payment

    async def get_all(self, owner_id: int) -> list[Payment]:
        return await self.repo.get_all_by_owner(owner_id)

    async def get_by_lease(self, lease_id: int, owner_id: int) -> list[Payment]:
        # Verify lease belongs to owner
        lease = await self.lease_repo.get_by_id_and_owner(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", lease_id)
        return await self.repo.get_by_lease(lease_id, owner_id)

    async def get_by_property_unit(self, property_unit_id: int, owner_id: int) -> list[Payment]:
        return await self.repo.get_by_property_unit(property_unit_id, owner_id)

    async def get_by_tenant(self, tenant_id: int, owner_id: int) -> list[Payment]:
        return await self.repo.get_by_tenant(tenant_id, owner_id)

    async def update(self, payment_id: int, data: PaymentUpdate, owner_id: int) -> Payment:
        payment = await self.get_by_id(payment_id, owner_id)

        if data.amount is not None:
            payment.amount = data.amount
        if data.payment_date is not None:
            payment.payment_date = data.payment_date
        if data.payment_type is not None:
            payment.payment_type = data.payment_type
        if data.description is not None:
            payment.description = data.description
        if data.status is not None:
            payment.status = data.status

        return await self.repo.update(payment)

    async def delete(self, payment_id: int, owner_id: int) -> None:
        payment = await self.get_by_id(payment_id, owner_id)
        await self.repo.delete(payment)

    async def get_outstanding_by_lease(self, lease_id: int, owner_id: int) -> list[Payment]:
        return await self.repo.get_by_lease_and_status(lease_id, PaymentStatus.PENDING, owner_id)

    async def get_total_paid_by_lease(
        self, lease_id: int, payment_type: PaymentType, owner_id: int
    ) -> Decimal:
        # Verify lease belongs to owner
        lease = await self.lease_repo.get_by_id_and_owner(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", lease_id)
        return await self.repo.sum_by_lease_and_type(lease_id, payment_type, owner_id)

    async def get_payment_history(
        self, lease_id: int, start_date: date, end_date: date, owner_id: int
    ) -> list[Payment]:
        # Verify lease belongs to owner
        lease = await self.lease_repo.get_by_id_and_owner(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", lease_id)
        return await self.repo.get_by_lease_and_date_range(lease_id, start_date, end_date)

    async def calculate_outstanding_amount(
        self, lease_id: int, as_of_date: date | None, owner_id: int
    ) -> Decimal:
        lease = await self.lease_repo.get_by_id_and_owner(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", lease_id)

        effective_date = as_of_date or date.today()
        start_date = lease.start_date

        if effective_date < start_date:
            return Decimal("0")

        # Calculate months elapsed since lease start
        delta = relativedelta(effective_date, start_date)
        months_elapsed = delta.years * 12 + delta.months + 1

        # Expected total = monthly rent * months elapsed
        expected_total = lease.monthly_rent * months_elapsed

        # Get total paid rent
        total_paid = await self.repo.sum_by_lease_and_type(lease_id, PaymentType.RENT, owner_id)

        # Outstanding = Expected - Paid (minimum 0)
        outstanding = expected_total - total_paid
        return max(outstanding, Decimal("0"))
