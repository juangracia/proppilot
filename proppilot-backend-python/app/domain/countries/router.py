from fastapi import APIRouter, HTTPException, status

from app.domain.countries.schemas import CountryInfoResponse
from app.domain.countries.service import CountryConfigService
from app.domain.leases.models import AdjustmentIndex

router = APIRouter()
country_service = CountryConfigService()


@router.get("", response_model=list[CountryInfoResponse])
async def get_all_countries():
    """Get all supported countries with their configurations."""
    return country_service.get_supported_countries()


@router.get("/{code}", response_model=CountryInfoResponse)
async def get_country_by_code(code: str):
    """Get country details by ISO 3166-1 alpha-2 code."""
    country = country_service.get_country_info(code)
    if country is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {code}",
        )
    return country


@router.get("/{code}/indices", response_model=list[AdjustmentIndex])
async def get_available_indices(code: str):
    """Get the list of available adjustment indices for a specific country."""
    if not country_service.is_country_supported(code):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {code}",
        )
    return country_service.get_available_indices(code)


@router.get("/with-indices", response_model=list[str])
async def get_countries_with_indices():
    """Get a list of country codes that have automatic adjustment index support."""
    return country_service.get_countries_with_indices()
