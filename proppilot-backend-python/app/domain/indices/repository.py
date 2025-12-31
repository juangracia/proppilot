from datetime import date

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.indices.models import IndexType, IndexValue


class IndexValueRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, index_value: IndexValue) -> IndexValue:
        self.db.add(index_value)
        await self.db.flush()
        await self.db.refresh(index_value)
        return index_value

    async def get_latest_by_type_and_country(
        self, index_type: IndexType, country_code: str
    ) -> IndexValue | None:
        result = await self.db.execute(
            select(IndexValue)
            .where(
                IndexValue.index_type == index_type,
                IndexValue.country_code == country_code,
            )
            .order_by(IndexValue.value_date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_type_country_and_date(
        self, index_type: IndexType, country_code: str, value_date: date
    ) -> IndexValue | None:
        result = await self.db.execute(
            select(IndexValue).where(
                IndexValue.index_type == index_type,
                IndexValue.country_code == country_code,
                IndexValue.value_date == value_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_closest_value(
        self, index_type: IndexType, country_code: str, target_date: date
    ) -> IndexValue | None:
        """Get the closest index value on or before the target date."""
        result = await self.db.execute(
            select(IndexValue)
            .where(
                IndexValue.index_type == index_type,
                IndexValue.country_code == country_code,
                IndexValue.value_date <= target_date,
            )
            .order_by(IndexValue.value_date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_history(
        self,
        index_type: IndexType,
        country_code: str,
        from_date: date,
        to_date: date,
    ) -> list[IndexValue]:
        result = await self.db.execute(
            select(IndexValue)
            .where(
                IndexValue.index_type == index_type,
                IndexValue.country_code == country_code,
                IndexValue.value_date >= from_date,
                IndexValue.value_date <= to_date,
            )
            .order_by(IndexValue.value_date.desc())
        )
        return list(result.scalars().all())

    async def get_all_latest_by_country(self, country_code: str) -> list[IndexValue]:
        """Get the latest value for each index type in a country."""
        # Subquery to get max date for each index type
        subquery = (
            select(
                IndexValue.index_type,
                func.max(IndexValue.value_date).label("max_date"),
            )
            .where(IndexValue.country_code == country_code)
            .group_by(IndexValue.index_type)
            .subquery()
        )

        result = await self.db.execute(
            select(IndexValue)
            .join(
                subquery,
                and_(
                    IndexValue.index_type == subquery.c.index_type,
                    IndexValue.value_date == subquery.c.max_date,
                ),
            )
            .where(IndexValue.country_code == country_code)
        )
        return list(result.scalars().all())

    async def exists(
        self, index_type: IndexType, country_code: str, value_date: date
    ) -> bool:
        result = await self.db.execute(
            select(func.count(IndexValue.id)).where(
                IndexValue.index_type == index_type,
                IndexValue.country_code == country_code,
                IndexValue.value_date == value_date,
            )
        )
        return result.scalar() > 0
