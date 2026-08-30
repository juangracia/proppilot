from pydantic import BaseModel

from app.domain.leases.models import AdjustmentIndex


class CountryInfoResponse(BaseModel):
    code: str
    name: str
    currency: str
    hasIndices: bool
    availableIndices: list[AdjustmentIndex]
