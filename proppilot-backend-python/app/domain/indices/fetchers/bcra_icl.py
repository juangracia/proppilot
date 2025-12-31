import io
import logging
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

import httpx

from app.domain.indices.fetchers.base import ExternalIndexFetcher
from app.domain.indices.models import IndexType, IndexValue

logger = logging.getLogger(__name__)

XLS_URL = "https://www.bcra.gob.ar/Pdfs/PublicacionesEstadisticas/diar_icl.xls"
SOURCE = "bcra.gob.ar"


class BcraIclFetcher(ExternalIndexFetcher):
    """Fetches ICL (Índice de Contratos de Locación) from BCRA Excel file."""

    def get_supported_index_types(self) -> list[IndexType]:
        return [IndexType.ICL]

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
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(XLS_URL)
                response.raise_for_status()
                xls_bytes = response.content
                logger.info(f"Downloaded ICL Excel file: {len(xls_bytes)} bytes")

            # Import xlrd here to avoid loading it if not needed
            import xlrd

            workbook = xlrd.open_workbook(file_contents=xls_bytes)
            sheet = workbook.sheet_by_index(0)

            # Start from row 2 (0-indexed) to skip headers
            for row_num in range(2, sheet.nrows):
                try:
                    date_cell = sheet.cell(row_num, 0)
                    value_cell = sheet.cell(row_num, 1)

                    value_date = self._extract_date(date_cell, workbook.datemode)
                    value = self._extract_numeric(value_cell)

                    if value_date and value is not None:
                        index_value = IndexValue(
                            index_type=IndexType.ICL,
                            country_code=self.get_country_code(),
                            value_date=value_date,
                            value=value,
                            source=SOURCE,
                        )
                        results.append(index_value)
                except Exception as e:
                    logger.debug(f"Could not parse row {row_num}: {e}")
                    continue

            # Sort by date ascending
            results.sort(key=lambda x: x.value_date)
            logger.info(f"Fetched {len(results)} ICL historical values from BCRA Excel")

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching ICL from BCRA Excel: {e}")
        except Exception as e:
            logger.error(f"Error fetching ICL from BCRA Excel: {e}")

        return results

    def _extract_date(self, cell, datemode: int) -> date | None:
        """Extract date from Excel cell."""
        import xlrd

        try:
            if cell.ctype == xlrd.XL_CELL_DATE:
                dt_tuple = xlrd.xldate_as_tuple(cell.value, datemode)
                return date(dt_tuple[0], dt_tuple[1], dt_tuple[2])
            elif cell.ctype == xlrd.XL_CELL_TEXT:
                date_str = cell.value.strip()
                # BCRA Excel uses dd/MM/yyyy format
                if "/" in date_str:
                    return datetime.strptime(date_str, "%d/%m/%Y").date()
                # Fallback to ISO format
                return date.fromisoformat(date_str)
            elif cell.ctype == xlrd.XL_CELL_NUMBER:
                # Try as Excel date serial number
                dt_tuple = xlrd.xldate_as_tuple(cell.value, datemode)
                return date(dt_tuple[0], dt_tuple[1], dt_tuple[2])
        except Exception as e:
            logger.debug(f"Could not parse date from cell: {e}")
        return None

    def _extract_numeric(self, cell) -> Decimal | None:
        """Extract numeric value from Excel cell."""
        import xlrd

        try:
            if cell.ctype == xlrd.XL_CELL_NUMBER:
                return Decimal(str(cell.value))
            elif cell.ctype == xlrd.XL_CELL_TEXT:
                value_str = cell.value.strip().replace(",", ".")
                return Decimal(value_str)
        except Exception as e:
            logger.debug(f"Could not parse numeric from cell: {e}")
        return None
