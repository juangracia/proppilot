import logging
from datetime import date
from decimal import Decimal

import httpx

from app.domain.indices.fetchers.base import ExternalIndexFetcher
from app.domain.indices.models import IndexType, IndexValue

logger = logging.getLogger(__name__)

API_URL = "https://api.argentinadatos.com/v1/finanzas/indices/inflacion"
SOURCE = "argentinadatos.com"


class ArgentinaDatosIpcFetcher(ExternalIndexFetcher):
    """Fetches IPC (Índice de Precios al Consumidor) from ArgentinaDatos API."""

    def get_supported_index_types(self) -> list[IndexType]:
        return [IndexType.IPC]

    def get_country_code(self) -> str:
        return "AR"

    async def fetch_latest_values(self) -> list[IndexValue]:
        all_values = await self.fetch_all_historical_values()
        if not all_values:
            return []
        # Return only the latest value
        return [all_values[-1]]

    async def fetch_all_historical_values(self) -> list[IndexValue]:
        results = []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(API_URL)
                response.raise_for_status()
                data = response.json()

                for item in data:
                    fecha_str = item.get("fecha")
                    valor = item.get("valor")

                    if fecha_str and valor is not None:
                        value_date = date.fromisoformat(fecha_str)
                        index_value = IndexValue(
                            index_type=IndexType.IPC,
                            country_code=self.get_country_code(),
                            value_date=value_date,
                            value=Decimal(str(valor)),
                            source=SOURCE,
                        )
                        results.append(index_value)

                # Sort by date ascending
                results.sort(key=lambda x: x.value_date)
                logger.info(
                    f"Fetched {len(results)} IPC historical values from ArgentinaDatos"
                )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching IPC from ArgentinaDatos: {e}")
        except Exception as e:
            logger.error(f"Error fetching IPC from ArgentinaDatos: {e}")

        return results
