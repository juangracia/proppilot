import logging
from datetime import datetime
from decimal import Decimal

import httpx

from app.domain.indices.fetchers.base import ExternalIndexFetcher
from app.domain.indices.models import IndexType, IndexValue

logger = logging.getLogger(__name__)

API_URL = "https://dolarapi.com/v1/dolares"
SOURCE = "dolarapi.com"

CASA_TO_INDEX = {
    "blue": IndexType.DOLAR_BLUE,
    "bolsa": IndexType.DOLAR_MEP,
    "oficial": IndexType.DOLAR_OFICIAL,
}


class DolarApiFetcher(ExternalIndexFetcher):
    """Fetches dollar exchange rates from dolarapi.com"""

    def get_supported_index_types(self) -> list[IndexType]:
        return [IndexType.DOLAR_BLUE, IndexType.DOLAR_MEP, IndexType.DOLAR_OFICIAL]

    def get_country_code(self) -> str:
        return "AR"

    async def fetch_latest_values(self) -> list[IndexValue]:
        results = []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(API_URL)
                response.raise_for_status()
                data = response.json()

                for item in data:
                    casa = item.get("casa")
                    index_type = CASA_TO_INDEX.get(casa)

                    if index_type and item.get("venta") is not None:
                        fecha_str = item.get("fechaActualizacion")
                        if fecha_str:
                            value_date = datetime.fromisoformat(
                                fecha_str.replace("Z", "+00:00")
                            ).date()
                        else:
                            value_date = datetime.now().date()

                        index_value = IndexValue(
                            index_type=index_type,
                            country_code=self.get_country_code(),
                            value_date=value_date,
                            value=Decimal(str(item["venta"])),
                            source=SOURCE,
                            raw_response=str(item),
                        )
                        results.append(index_value)
                        logger.info(
                            f"Fetched {index_type.value} = {item['venta']} for date {value_date}"
                        )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching dollar rates from DolarApi: {e}")
        except Exception as e:
            logger.error(f"Error fetching dollar rates from DolarApi: {e}")

        return results
