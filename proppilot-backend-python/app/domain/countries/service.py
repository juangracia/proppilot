from app.domain.countries.schemas import CountryInfoResponse
from app.domain.leases.models import AdjustmentIndex


# Static country configuration
COUNTRY_CONFIG: dict[str, CountryInfoResponse] = {
    "AR": CountryInfoResponse(
        code="AR",
        name="Argentina",
        currency="ARS",
        hasIndices=True,
        availableIndices=[
            AdjustmentIndex.ICL,
            AdjustmentIndex.IPC,
            AdjustmentIndex.DOLAR_BLUE,
            AdjustmentIndex.DOLAR_MEP,
            AdjustmentIndex.DOLAR_OFICIAL,
            AdjustmentIndex.NONE,
        ],
    ),
    "US": CountryInfoResponse(
        code="US",
        name="United States",
        currency="USD",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "ES": CountryInfoResponse(
        code="ES",
        name="Spain",
        currency="EUR",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "MX": CountryInfoResponse(
        code="MX",
        name="Mexico",
        currency="MXN",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "CL": CountryInfoResponse(
        code="CL",
        name="Chile",
        currency="CLP",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "CO": CountryInfoResponse(
        code="CO",
        name="Colombia",
        currency="COP",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "UY": CountryInfoResponse(
        code="UY",
        name="Uruguay",
        currency="UYU",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "BR": CountryInfoResponse(
        code="BR",
        name="Brazil",
        currency="BRL",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
    "PE": CountryInfoResponse(
        code="PE",
        name="Peru",
        currency="PEN",
        hasIndices=False,
        availableIndices=[AdjustmentIndex.NONE],
    ),
}


class CountryConfigService:
    def get_available_indices(self, country_code: str) -> list[AdjustmentIndex]:
        config = COUNTRY_CONFIG.get(country_code.upper())
        if config:
            return config.availableIndices
        return [AdjustmentIndex.NONE]

    def is_valid_index_for_country(
        self, index: AdjustmentIndex, country_code: str
    ) -> bool:
        return index in self.get_available_indices(country_code)

    def get_supported_countries(self) -> list[CountryInfoResponse]:
        return sorted(COUNTRY_CONFIG.values(), key=lambda c: c.name.lower())

    def get_country_info(self, country_code: str) -> CountryInfoResponse | None:
        return COUNTRY_CONFIG.get(country_code.upper())

    def is_country_supported(self, country_code: str) -> bool:
        return country_code.upper() in COUNTRY_CONFIG

    def get_countries_with_indices(self) -> list[str]:
        return [
            country.code
            for country in COUNTRY_CONFIG.values()
            if country.hasIndices
        ]
