from abc import ABC, abstractmethod

from app.domain.indices.models import IndexType, IndexValue


class ExternalIndexFetcher(ABC):
    """Base class for external index data fetchers."""

    @abstractmethod
    def get_supported_index_types(self) -> list[IndexType]:
        """Return the list of index types this fetcher supports."""
        pass

    @abstractmethod
    def get_country_code(self) -> str:
        """Return the country code this fetcher provides data for."""
        pass

    @abstractmethod
    async def fetch_latest_values(self) -> list[IndexValue]:
        """Fetch the latest values from the external source."""
        pass

    async def fetch_all_historical_values(self) -> list[IndexValue]:
        """
        Fetch all historical values from the external source.
        Used for initial data population. Default implementation returns latest values.
        """
        return await self.fetch_latest_values()
