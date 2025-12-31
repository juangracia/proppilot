from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUserId, DbSession
from app.domain.payments.models import PaymentType
from app.domain.payments.schemas import PaymentCreate, PaymentResponse, PaymentUpdate
from app.domain.payments.service import PaymentService

router = APIRouter()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: PaymentCreate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Create a new payment."""
    service = PaymentService(db)
    payment = await service.create(data, owner_id)
    return PaymentResponse.from_orm_with_computed(payment)


@router.get("", response_model=list[PaymentResponse])
async def get_all_payments(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all payments for the current user."""
    service = PaymentService(db)
    payments = await service.get_all(owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/lease/{lease_id}", response_model=list[PaymentResponse])
async def get_payments_by_lease(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all payments for a lease."""
    service = PaymentService(db)
    payments = await service.get_by_lease(lease_id, owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/property-unit/{property_unit_id}", response_model=list[PaymentResponse])
async def get_payments_by_property_unit(
    property_unit_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all payments for a property unit."""
    service = PaymentService(db)
    payments = await service.get_by_property_unit(property_unit_id, owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/tenant/{tenant_id}", response_model=list[PaymentResponse])
async def get_payments_by_tenant(
    tenant_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get all payments for a tenant."""
    service = PaymentService(db)
    payments = await service.get_by_tenant(tenant_id, owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/lease/{lease_id}/outstanding", response_model=list[PaymentResponse])
async def get_outstanding_payments(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get outstanding (pending) payments for a lease."""
    service = PaymentService(db)
    payments = await service.get_outstanding_by_lease(lease_id, owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/lease/{lease_id}/outstanding-amount")
async def get_outstanding_amount(
    lease_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
    as_of_date: date | None = Query(None, alias="asOfDate"),
) -> Decimal:
    """Calculate outstanding rent amount for a lease."""
    service = PaymentService(db)
    return await service.calculate_outstanding_amount(lease_id, as_of_date, owner_id)


@router.get("/lease/{lease_id}/total-paid")
async def get_total_paid(
    lease_id: int,
    payment_type: PaymentType = Query(..., alias="paymentType"),
    db: DbSession = None,
    owner_id: CurrentUserId = None,
) -> Decimal:
    """Get total paid amount by payment type for a lease."""
    service = PaymentService(db)
    return await service.get_total_paid_by_lease(lease_id, payment_type, owner_id)


@router.get("/lease/{lease_id}/history", response_model=list[PaymentResponse])
async def get_payment_history(
    lease_id: int,
    start_date: date = Query(..., alias="startDate"),
    end_date: date = Query(..., alias="endDate"),
    db: DbSession = None,
    owner_id: CurrentUserId = None,
):
    """Get payment history for a lease within a date range."""
    service = PaymentService(db)
    payments = await service.get_payment_history(lease_id, start_date, end_date, owner_id)
    return [PaymentResponse.from_orm_with_computed(p) for p in payments]


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Get a payment by ID."""
    service = PaymentService(db)
    payment = await service.get_by_id(payment_id, owner_id)
    return PaymentResponse.from_orm_with_computed(payment)


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Update a payment."""
    service = PaymentService(db)
    payment = await service.update(payment_id, data, owner_id)
    return PaymentResponse.from_orm_with_computed(payment)


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Delete a payment."""
    service = PaymentService(db)
    await service.delete(payment_id, owner_id)
