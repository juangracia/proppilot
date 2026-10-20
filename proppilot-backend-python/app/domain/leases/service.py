from datetime import date, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessLogicException, ResourceNotFoundException
from app.domain.leases.models import AdjustmentIndex, Lease, LeaseStatus
from app.domain.leases.repository import LeaseRepository
from app.domain.leases.schemas import LeaseCreate, LeaseUpdate
from app.domain.properties.repository import PropertyUnitRepository
from app.domain.tenants.repository import TenantRepository

# Supported countries and their indices
SUPPORTED_COUNTRIES = {
    "AR": ["ICL", "IPC", "DOLAR_BLUE", "DOLAR_OFICIAL", "DOLAR_MEP", "NONE"],
}


class LeaseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LeaseRepository(db)
        self.property_repo = PropertyUnitRepository(db)
        self.tenant_repo = TenantRepository(db)

    def _validate_country(self, country_code: str) -> str:
        country_code = (country_code or "AR").upper()
        if country_code not in SUPPORTED_COUNTRIES:
            raise BusinessLogicException(f"Unsupported country code: {country_code}")
        return country_code

    def _validate_adjustment_index(self, index: AdjustmentIndex, country_code: str) -> None:
        if index and index.value not in SUPPORTED_COUNTRIES.get(country_code, []):
            raise BusinessLogicException(
                f"Adjustment index {index.value} is not available for country {country_code}"
            )

    async def create(self, data: LeaseCreate, owner_id: int) -> Lease:
        # Validate tenant IDs
        if not data.tenant_ids:
            raise BusinessLogicException("At least one tenant is required for lease")

        # Validate property exists and belongs to owner
        property_unit = await self.property_repo.get_by_id_and_owner(
            data.property_unit_id, owner_id
        )
        if property_unit is None:
            raise ResourceNotFoundException("Property unit", data.property_unit_id)

        # Validate all tenants exist and belong to owner
        tenants = []
        for tenant_id in data.tenant_ids:
            tenant = await self.tenant_repo.get_by_id_and_owner(tenant_id, owner_id)
            if tenant is None:
                raise ResourceNotFoundException("Tenant", tenant_id)
            tenants.append(tenant)

        # Validate dates
        if not data.end_date > data.start_date:
            raise BusinessLogicException("End date must be after start date")

        days_between = (data.end_date - data.start_date).days
        if days_between < 30:
            raise BusinessLogicException("Lease must be at least 30 days long")

        # Check for overlapping leases
        if await self.repo.has_overlapping_lease(
            data.property_unit_id, data.start_date, data.end_date
        ):
            raise BusinessLogicException(
                "There is already an active lease for this property during the specified period"
            )

        # Validate country and adjustment index
        country_code = self._validate_country(data.country_code)
        self._validate_adjustment_index(data.adjustment_index, country_code)

        lease = Lease(
            property_unit_id=data.property_unit_id,
            start_date=data.start_date,
            end_date=data.end_date,
            monthly_rent=data.monthly_rent,
            status=data.status or LeaseStatus.ACTIVE,
            adjustment_index=data.adjustment_index or AdjustmentIndex.ICL,
            adjustment_frequency_months=data.adjustment_frequency_months or 12,
            country_code=country_code,
            owner_id=owner_id,
        )
        lease.tenants = tenants
        lease.property_unit = property_unit

        return await self.repo.create(lease)

    async def get_by_id(self, lease_id: int, owner_id: int) -> Lease:
        lease = await self.repo.get_by_id_and_owner(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Lease", lease_id)
        return lease

    async def get_all(self, owner_id: int) -> list[Lease]:
        return await self.repo.get_all_by_owner(owner_id)

    async def get_active(self, owner_id: int) -> list[Lease]:
        return await self.repo.get_active_by_owner(owner_id, date.today())

    async def get_by_property_unit(self, property_unit_id: int, owner_id: int) -> list[Lease]:
        # Verify property belongs to owner
        property_unit = await self.property_repo.get_by_id_and_owner(property_unit_id, owner_id)
        if property_unit is None:
            raise ResourceNotFoundException("Property unit", property_unit_id)
        return await self.repo.get_by_property_unit(property_unit_id, owner_id)

    async def get_active_by_property_unit(
        self, property_unit_id: int, owner_id: int
    ) -> Lease | None:
        return await self.repo.get_active_by_property_unit(
            property_unit_id, owner_id, date.today()
        )

    async def get_by_tenant(self, tenant_id: int, owner_id: int) -> list[Lease]:
        # Verify tenant belongs to owner
        tenant = await self.tenant_repo.get_by_id_and_owner(tenant_id, owner_id)
        if tenant is None:
            raise ResourceNotFoundException("Tenant", tenant_id)
        return await self.repo.get_by_tenant(tenant_id, owner_id)

    async def get_active_by_tenant(self, tenant_id: int, owner_id: int) -> list[Lease]:
        return await self.repo.get_active_by_tenant(tenant_id, owner_id, date.today())

    async def update(self, lease_id: int, data: LeaseUpdate, owner_id: int) -> Lease:
        lease = await self.get_by_id(lease_id, owner_id)

        # Check for date changes and validate
        new_start = data.start_date if data.start_date else lease.start_date
        new_end = data.end_date if data.end_date else lease.end_date

        if data.start_date or data.end_date:
            if not new_end > new_start:
                raise BusinessLogicException("End date must be after start date")

            days_between = (new_end - new_start).days
            if days_between < 30:
                raise BusinessLogicException("Lease must be at least 30 days long")

            if await self.repo.has_overlapping_lease(
                lease.property_unit_id, new_start, new_end, lease_id
            ):
                raise BusinessLogicException(
                    "There is already an active lease for this property during the specified period"
                )

            lease.start_date = new_start
            lease.end_date = new_end

        if data.monthly_rent is not None:
            lease.monthly_rent = data.monthly_rent

        if data.status is not None:
            lease.status = data.status

        if data.country_code is not None:
            country_code = self._validate_country(data.country_code)
            lease.country_code = country_code

        if data.adjustment_index is not None:
            country_code = lease.country_code or "AR"
            self._validate_adjustment_index(data.adjustment_index, country_code)
            lease.adjustment_index = data.adjustment_index

        if data.adjustment_frequency_months is not None:
            lease.adjustment_frequency_months = data.adjustment_frequency_months

        return await self.repo.update(lease)

    async def terminate(self, lease_id: int, owner_id: int) -> None:
        lease = await self.get_by_id(lease_id, owner_id)
        lease.status = LeaseStatus.TERMINATED
        await self.repo.update(lease)

    async def reactivate(self, lease_id: int, owner_id: int) -> None:
        lease = await self.get_by_id(lease_id, owner_id)

        if lease.status != LeaseStatus.TERMINATED:
            raise BusinessLogicException("Only terminated leases can be reactivated")

        # Check for overlapping leases
        if await self.repo.has_overlapping_lease(
            lease.property_unit_id, lease.start_date, lease.end_date, lease_id
        ):
            raise BusinessLogicException(
                "Cannot reactivate lease: there is already an active lease for this property during the specified period"
            )

        # Check if lease dates are still valid
        if lease.end_date < date.today():
            lease.status = LeaseStatus.EXPIRED
        else:
            lease.status = LeaseStatus.ACTIVE

        await self.repo.update(lease)

    async def soft_delete(self, lease_id: int, owner_id: int) -> None:
        lease = await self.get_by_id(lease_id, owner_id)
        lease.deleted = True
        lease.deleted_at = datetime.utcnow()
        await self.repo.update(lease)

    async def restore(self, lease_id: int, owner_id: int) -> None:
        lease = await self.repo.get_by_id_and_owner_deleted(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Deleted lease", lease_id)

        # Check for overlapping leases if restoring an active lease
        if lease.status == LeaseStatus.ACTIVE and await self.repo.has_overlapping_lease(
            lease.property_unit_id, lease.start_date, lease.end_date, lease_id
        ):
            raise BusinessLogicException(
                "Cannot restore lease: there is already an active lease for this property during the specified period"
            )

        lease.deleted = False
        lease.deleted_at = None
        await self.repo.update(lease)

    async def get_deleted(self, owner_id: int) -> list[Lease]:
        return await self.repo.get_deleted_by_owner(owner_id)

    async def permanently_delete(self, lease_id: int, owner_id: int) -> None:
        lease = await self.repo.get_by_id_and_owner_deleted(lease_id, owner_id)
        if lease is None:
            raise ResourceNotFoundException("Deleted lease", lease_id)
        await self.repo.delete(lease)
