import logging
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.indices.fetchers import (
    ArgentinaDatosIpcFetcher,
    BcraIclFetcher,
    DolarApiFetcher,
    ExternalIndexFetcher,
)
from app.domain.indices.models import IndexType, IndexValue
from app.domain.indices.repository import IndexValueRepository

logger = logging.getLogger(__name__)


class IndexValueService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = IndexValueRepository(db)
        self.fetchers: list[ExternalIndexFetcher] = [
            DolarApiFetcher(),
            BcraIclFetcher(),
            ArgentinaDatosIpcFetcher(),
        ]

    async def get_latest_value(
        self, country_code: str, index_type: IndexType
    ) -> IndexValue | None:
        return await self.repo.get_latest_by_type_and_country(
            index_type, country_code.upper()
        )

    async def get_value_for_date(
        self, country_code: str, index_type: IndexType, value_date: date
    ) -> IndexValue | None:
        return await self.repo.get_by_type_country_and_date(
            index_type, country_code.upper(), value_date
        )

    async def get_closest_value(
        self, country_code: str, index_type: IndexType, target_date: date
    ) -> IndexValue | None:
        return await self.repo.get_closest_value(
            index_type, country_code.upper(), target_date
        )

    async def get_history(
        self,
        country_code: str,
        index_type: IndexType,
        from_date: date,
        to_date: date,
    ) -> list[IndexValue]:
        return await self.repo.get_history(
            index_type, country_code.upper(), from_date, to_date
        )

    async def get_all_latest_values(self, country_code: str) -> list[IndexValue]:
        return await self.repo.get_all_latest_by_country(country_code.upper())

    async def calculate_adjustment_factor(
        self,
        country_code: str,
        index_type: IndexType,
        from_date: date,
        to_date: date,
    ) -> Decimal:
        if index_type == IndexType.NONE:
            return Decimal("1")

        from_value = await self.get_closest_value(country_code, index_type, from_date)
        to_value = await self.get_closest_value(country_code, index_type, to_date)

        if not from_value or not to_value:
            logger.warning(
                f"Cannot calculate adjustment factor: missing index values for "
                f"{index_type} from {from_date} to {to_date}"
            )
            return Decimal("1")

        if from_value.value == Decimal("0"):
            logger.warning(
                f"Cannot calculate adjustment factor: fromValue is zero for {index_type}"
            )
            return Decimal("1")

        return (to_value.value / from_value.value).quantize(
            Decimal("0.000001"), rounding=ROUND_HALF_UP
        )

    async def calculate_annual_percentage_change(
        self, country_code: str, index_type: IndexType
    ) -> Decimal:
        if index_type == IndexType.NONE:
            return Decimal("0")

        now = date.today()
        one_year_ago = now - relativedelta(years=1)

        if index_type == IndexType.IPC:
            # For IPC, calculate accumulated inflation over last 12 months
            history = await self.get_history(country_code, index_type, one_year_ago, now)
            if not history:
                logger.warning("No IPC history found for annual change calculation")
                return Decimal("0")

            accumulated = Decimal("1")
            for value in history:
                # IPC values are monthly percentage (e.g., 2.3 means 2.3%)
                factor = Decimal("1") + (value.value / Decimal("100"))
                accumulated *= factor

            # Convert to percentage: (accumulated - 1) * 100
            return ((accumulated - Decimal("1")) * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            # For ICL, DOLAR_*, etc: (current / year_ago - 1) * 100
            current_value = await self.get_latest_value(country_code, index_type)
            year_ago_value = await self.get_closest_value(
                country_code, index_type, one_year_ago
            )

            if not current_value or not year_ago_value:
                logger.warning(
                    f"Cannot calculate annual change: missing values for {index_type}"
                )
                return Decimal("0")

            if year_ago_value.value == Decimal("0"):
                return Decimal("0")

            # (current / yearAgo - 1) * 100
            return (
                (current_value.value / year_ago_value.value - Decimal("1"))
                * Decimal("100")
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def calculate_monthly_percentage_change(
        self, country_code: str, index_type: IndexType
    ) -> Decimal:
        if index_type == IndexType.NONE:
            return Decimal("0")

        if index_type == IndexType.IPC:
            # For IPC, the stored value IS the monthly percentage change
            latest_value = await self.get_latest_value(country_code, index_type)
            if not latest_value:
                logger.warning("No IPC value found for monthly change")
                return Decimal("0")
            return latest_value.value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            # For ICL, DOLAR_*, etc: (current / month_ago - 1) * 100
            now = date.today()
            one_month_ago = now - relativedelta(months=1)

            current_value = await self.get_latest_value(country_code, index_type)
            month_ago_value = await self.get_closest_value(
                country_code, index_type, one_month_ago
            )

            if not current_value or not month_ago_value:
                logger.warning(
                    f"Cannot calculate monthly change: missing values for {index_type}"
                )
                return Decimal("0")

            if month_ago_value.value == Decimal("0"):
                return Decimal("0")

            # (current / monthAgo - 1) * 100
            return (
                (current_value.value / month_ago_value.value - Decimal("1"))
                * Decimal("100")
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def calculate_adjusted_rent(
        self,
        base_rent: Decimal,
        country_code: str,
        index_type: IndexType,
        lease_start_date: date,
        payment_date: date,
    ) -> Decimal:
        if base_rent is None or base_rent <= Decimal("0"):
            return base_rent

        if index_type is None or index_type == IndexType.NONE:
            return base_rent

        adjustment_factor = await self.calculate_adjustment_factor(
            country_code, index_type, lease_start_date, payment_date
        )

        adjusted_rent = (base_rent * adjustment_factor).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        logger.info(
            f"Calculated adjusted rent: base={base_rent}, factor={adjustment_factor}, "
            f"adjusted={adjusted_rent} (index={index_type}, "
            f"from={lease_start_date}, to={payment_date})"
        )

        return adjusted_rent

    async def refresh_all_indices(self) -> None:
        logger.info("Starting refresh of all indices...")

        countries_with_indices = ["AR"]  # Currently only Argentina has indices
        for country_code in countries_with_indices:
            await self.refresh_indices_for_country(country_code)

        logger.info("Finished refreshing all indices")

    async def refresh_indices_for_country(self, country_code: str) -> None:
        logger.info(f"Refreshing indices for country: {country_code}")

        for fetcher in self.fetchers:
            if fetcher.get_country_code() != country_code.upper():
                continue

            try:
                values = await fetcher.fetch_latest_values()
                for value in values:
                    await self._save_index_value_if_new(value)
                logger.info(
                    f"Fetched {len(values)} values from {fetcher.__class__.__name__}"
                )
            except Exception as e:
                logger.error(
                    f"Error fetching from {fetcher.__class__.__name__}: {e}", exc_info=True
                )

    async def import_all_historical_data(self) -> None:
        logger.info("Starting import of all historical index data...")

        for fetcher in self.fetchers:
            try:
                values = await fetcher.fetch_all_historical_values()
                imported = 0
                for value in values:
                    exists = await self.repo.exists(
                        value.index_type, value.country_code, value.value_date
                    )
                    if not exists:
                        await self.repo.create(value)
                        imported += 1
                logger.info(
                    f"Imported {imported} new values from {fetcher.__class__.__name__} "
                    f"(fetched {len(values)} total)"
                )
            except Exception as e:
                logger.error(
                    f"Error importing historical data from {fetcher.__class__.__name__}: {e}",
                    exc_info=True,
                )

        logger.info("Finished importing all historical index data")

    async def save_index_value(self, index_value: IndexValue) -> IndexValue:
        return await self.repo.create(index_value)

    async def _save_index_value_if_new(self, index_value: IndexValue) -> None:
        exists = await self.repo.exists(
            index_value.index_type, index_value.country_code, index_value.value_date
        )

        if not exists:
            await self.repo.create(index_value)
            logger.debug(
                f"Saved new index value: {index_value.index_type} = {index_value.value} "
                f"for {index_value.country_code} on {index_value.value_date}"
            )
        else:
            logger.debug(
                f"Index value already exists: {index_value.index_type} "
                f"for {index_value.country_code} on {index_value.value_date}"
            )
