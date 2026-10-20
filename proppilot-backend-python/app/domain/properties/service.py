from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessLogicException, ResourceNotFoundException
from app.domain.properties.models import PropertyUnit
from app.domain.properties.repository import PropertyUnitRepository
from app.domain.properties.schemas import PropertyUnitCreate, PropertyUnitUpdate


class PropertyUnitService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PropertyUnitRepository(db)

    async def create(self, data: PropertyUnitCreate, owner_id: int) -> PropertyUnit:
        # Compute address from structured fields if not provided
        address = data.address if data.address else data.compute_address()

        property_unit = PropertyUnit(
            address=address,
            street=data.street,
            street_number=data.street_number,
            floor=data.floor,
            apartment=data.apartment,
            city=data.city,
            province=data.province,
            postal_code=data.postal_code,
            type=data.type,
            base_rent_amount=data.base_rent_amount,
            lease_start_date=data.lease_start_date,
            owner_id=owner_id,
        )
        return await self.repo.create(property_unit)

    async def get_by_id(self, property_id: int, owner_id: int) -> PropertyUnit:
        property_unit = await self.repo.get_by_id_and_owner(property_id, owner_id)
        if property_unit is None:
            raise ResourceNotFoundException("Property unit", property_id)
        return property_unit

    async def get_all(self, owner_id: int) -> list[PropertyUnit]:
        return await self.repo.get_all_by_owner(owner_id)

    async def get_all_with_leases(self, owner_id: int) -> list[PropertyUnit]:
        return await self.repo.get_all_with_leases(owner_id)

    async def search(self, address: str, owner_id: int) -> list[PropertyUnit]:
        return await self.repo.search_by_address(address, owner_id)

    async def update(
        self, property_id: int, data: PropertyUnitUpdate, owner_id: int
    ) -> PropertyUnit:
        property_unit = await self.get_by_id(property_id, owner_id)

        # Track if structured fields changed to recompute address
        structured_fields_changed = False

        if data.address is not None:
            property_unit.address = data.address
        if data.street is not None:
            property_unit.street = data.street
            structured_fields_changed = True
        if data.street_number is not None:
            property_unit.street_number = data.street_number
            structured_fields_changed = True
        if data.floor is not None:
            property_unit.floor = data.floor
            structured_fields_changed = True
        if data.apartment is not None:
            property_unit.apartment = data.apartment
            structured_fields_changed = True
        if data.city is not None:
            property_unit.city = data.city
            structured_fields_changed = True
        if data.province is not None:
            property_unit.province = data.province
            structured_fields_changed = True
        if data.postal_code is not None:
            property_unit.postal_code = data.postal_code
        if data.type is not None:
            property_unit.type = data.type
        if data.base_rent_amount is not None:
            property_unit.base_rent_amount = data.base_rent_amount
        if data.lease_start_date is not None:
            property_unit.lease_start_date = data.lease_start_date

        # Recompute address if structured fields changed and no explicit address was provided
        if structured_fields_changed and data.address is None:
            property_unit.address = property_unit.get_full_address()

        return await self.repo.update(property_unit)

    async def delete(self, property_id: int, owner_id: int) -> None:
        property_unit = await self.get_by_id(property_id, owner_id)

        lease_count = await self.repo.count_leases(property_id)
        if lease_count > 0:
            raise BusinessLogicException(
                f"No se puede eliminar la propiedad porque tiene {lease_count} contrato(s) activo(s). "
                "Debes eliminar primero los contratos antes de poder eliminar la propiedad."
            )

        await self.repo.delete(property_unit)

    async def can_delete(self, property_id: int, owner_id: int) -> dict:
        # Verify property exists
        await self.get_by_id(property_id, owner_id)

        lease_count = await self.repo.count_leases(property_id)

        if lease_count > 0:
            return {
                "canDelete": False,
                "reason": f"Esta propiedad tiene {lease_count} contrato(s) asociado(s). "
                "Debes eliminar primero los contratos antes de poder eliminar la propiedad.",
                "leaseCount": lease_count,
            }
        else:
            return {
                "canDelete": True,
                "reason": None,
                "leaseCount": 0,
            }
