from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import DbSession
from app.domain.indices.models import IndexType
from app.domain.indices.schemas import IndexValueResponse
from app.domain.indices.service import IndexValueService

router = APIRouter()


@router.get("/{country_code}/all/latest", response_model=list[IndexValueResponse])
async def get_all_latest_values(
    country_code: str,
    db: DbSession,
):
    """Get the latest values for all index types in a country."""
    service = IndexValueService(db)
    values = await service.get_all_latest_values(country_code)
    return values


@router.get("/{country_code}/{type}/latest", response_model=IndexValueResponse)
async def get_latest_value(
    country_code: str,
    type: IndexType,
    db: DbSession,
):
    """Get the latest index value for a specific type and country."""
    service = IndexValueService(db)
    value = await service.get_latest_value(country_code, type)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No data available for index {type.value} in {country_code}",
        )
    return value


@router.get("/{country_code}/{type}/date/{value_date}", response_model=IndexValueResponse)
async def get_value_for_date(
    country_code: str,
    type: IndexType,
    value_date: date,
    db: DbSession,
):
    """Get the index value for a specific date."""
    service = IndexValueService(db)
    value = await service.get_value_for_date(country_code, type, value_date)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No data available for index {type.value} on {value_date}",
        )
    return value


@router.get("/{country_code}/{type}/closest", response_model=IndexValueResponse)
async def get_closest_value(
    country_code: str,
    type: IndexType,
    db: DbSession,
    target_date: date = Query(..., alias="date"),
):
    """Get the closest index value on or before the specified date."""
    service = IndexValueService(db)
    value = await service.get_closest_value(country_code, type, target_date)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No data available for index {type.value} on or before {target_date}",
        )
    return value


@router.get("/{country_code}/{type}/history", response_model=list[IndexValueResponse])
async def get_history(
    country_code: str,
    type: IndexType,
    db: DbSession,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
):
    """Get index value history within a date range."""
    service = IndexValueService(db)
    values = await service.get_history(country_code, type, from_date, to_date)
    return values


@router.get("/calculate-adjustment")
async def calculate_adjustment(
    db: DbSession,
    country: str = Query(...),
    type: IndexType = Query(...),
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
):
    """Calculate the adjustment factor between two dates for a specific index."""
    service = IndexValueService(db)
    factor = await service.calculate_adjustment_factor(country, type, from_date, to_date)

    return {
        "country": country.upper(),
        "indexType": type.value,
        "fromDate": from_date.isoformat(),
        "toDate": to_date.isoformat(),
        "factor": factor,
    }


@router.post("/refresh")
async def refresh_all_indices(db: DbSession):
    """Manually trigger a refresh of all index values from external sources."""
    service = IndexValueService(db)
    await service.refresh_all_indices()
    return {"status": "Refresh completed"}


@router.post("/refresh/{country_code}")
async def refresh_indices_for_country(
    country_code: str,
    db: DbSession,
):
    """Manually trigger a refresh of index values for a specific country."""
    service = IndexValueService(db)
    await service.refresh_indices_for_country(country_code)
    return {"status": f"Refresh completed for {country_code.upper()}"}


@router.post("/import-historical")
async def import_historical_data(db: DbSession):
    """Import all historical index values from external sources (one-time use)."""
    service = IndexValueService(db)
    await service.import_all_historical_data()
    return {"status": "Historical data import completed"}


@router.get("/{country_code}/{type}/annual-change")
async def get_annual_change(
    country_code: str,
    type: IndexType,
    db: DbSession,
):
    """Get the annual percentage change for an index."""
    service = IndexValueService(db)
    annual_change = await service.calculate_annual_percentage_change(country_code, type)

    return {
        "country": country_code.upper(),
        "indexType": type.value,
        "annualChangePercent": annual_change,
    }


@router.get("/{country_code}/all/annual-changes")
async def get_all_annual_changes(
    country_code: str,
    db: DbSession,
):
    """Get the annual percentage changes for all indices in a country."""
    service = IndexValueService(db)

    results = []
    for index_type in [
        IndexType.ICL,
        IndexType.IPC,
        IndexType.DOLAR_OFICIAL,
        IndexType.DOLAR_BLUE,
        IndexType.DOLAR_MEP,
    ]:
        change = await service.calculate_annual_percentage_change(
            country_code, index_type
        )
        results.append(
            {
                "indexType": index_type.value,
                "annualChangePercent": change,
            }
        )

    return results


@router.get("/{country_code}/{type}/monthly-change")
async def get_monthly_change(
    country_code: str,
    type: IndexType,
    db: DbSession,
):
    """Get the monthly percentage change for an index."""
    service = IndexValueService(db)
    monthly_change = await service.calculate_monthly_percentage_change(country_code, type)

    return {
        "country": country_code.upper(),
        "indexType": type.value,
        "monthlyChangePercent": monthly_change,
    }


@router.get("/{country_code}/all/monthly-changes")
async def get_all_monthly_changes(
    country_code: str,
    db: DbSession,
):
    """Get the monthly percentage changes for all indices in a country."""
    service = IndexValueService(db)

    results = []
    for index_type in [
        IndexType.ICL,
        IndexType.IPC,
        IndexType.DOLAR_OFICIAL,
        IndexType.DOLAR_BLUE,
        IndexType.DOLAR_MEP,
    ]:
        change = await service.calculate_monthly_percentage_change(
            country_code, index_type
        )
        results.append(
            {
                "indexType": index_type.value,
                "monthlyChangePercent": change,
            }
        )

    return results
