import enum
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ImportAction(str, enum.Enum):
    CREATE = "CREATE"
    SKIP = "SKIP"
    ERROR = "ERROR"


# Excel row data models
class PropertyUnitExcelRow(BaseModel):
    street: str | None = None
    street_number: str | None = Field(None, alias="streetNumber")
    floor: str | None = None
    apartment: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = Field(None, alias="postalCode")
    type: str | None = None
    base_rent_amount: Decimal | None = Field(None, alias="baseRentAmount")

    def get_normalized_address(self) -> str:
        parts = [self.street, self.street_number, self.floor, self.apartment]
        return " ".join(p for p in parts if p).lower().strip()

    def get_full_address(self) -> str:
        parts = []
        if self.street:
            parts.append(self.street)
        if self.street_number:
            parts.append(self.street_number)
        if self.floor:
            parts.append(f"Piso {self.floor}")
        if self.apartment:
            parts.append(f"Depto {self.apartment}")
        return ", ".join(parts)


class TenantExcelRow(BaseModel):
    full_name: str | None = Field(None, alias="fullName")
    national_id: str | None = Field(None, alias="nationalId")
    email: str | None = None
    phone: str | None = None


class LeaseExcelRow(BaseModel):
    property_address: str | None = Field(None, alias="propertyAddress")
    tenant_national_ids: str | None = Field(None, alias="tenantNationalIds")
    start_date: date | None = Field(None, alias="startDate")
    end_date: date | None = Field(None, alias="endDate")
    monthly_rent: Decimal | None = Field(None, alias="monthlyRent")
    adjustment_index: str | None = Field(None, alias="adjustmentIndex")
    adjustment_frequency_months: int | None = Field(None, alias="adjustmentFrequencyMonths")
    status: str | None = None


class PaymentExcelRow(BaseModel):
    property_address: str | None = Field(None, alias="propertyAddress")
    tenant_national_id: str | None = Field(None, alias="tenantNationalId")
    lease_start_date: date | None = Field(None, alias="leaseStartDate")
    amount: Decimal | None = None
    payment_date: date | None = Field(None, alias="paymentDate")
    payment_type: str | None = Field(None, alias="paymentType")
    status: str | None = None
    description: str | None = None


# Row preview models
class ExcelRowPreview(BaseModel):
    row_number: int = Field(alias="rowNumber")
    data: dict
    valid: bool = False
    action: ImportAction = ImportAction.ERROR
    errors: list[str] = []
    warnings: list[str] = []


class PropertyRowPreview(BaseModel):
    row_number: int = Field(alias="rowNumber")
    data: PropertyUnitExcelRow
    valid: bool = False
    action: ImportAction = ImportAction.ERROR
    errors: list[str] = []
    warnings: list[str] = []


class TenantRowPreview(BaseModel):
    row_number: int = Field(alias="rowNumber")
    data: TenantExcelRow
    valid: bool = False
    action: ImportAction = ImportAction.ERROR
    errors: list[str] = []
    warnings: list[str] = []


class LeaseRowPreview(BaseModel):
    row_number: int = Field(alias="rowNumber")
    data: LeaseExcelRow
    valid: bool = False
    action: ImportAction = ImportAction.ERROR
    errors: list[str] = []
    warnings: list[str] = []


class PaymentRowPreview(BaseModel):
    row_number: int = Field(alias="rowNumber")
    data: PaymentExcelRow
    valid: bool = False
    action: ImportAction = ImportAction.ERROR
    errors: list[str] = []
    warnings: list[str] = []


# Import preview and result
class ExcelImportPreview(BaseModel):
    properties: list[PropertyRowPreview] = []
    tenants: list[TenantRowPreview] = []
    leases: list[LeaseRowPreview] = []
    payments: list[PaymentRowPreview] = []

    # Stats
    total_rows: int = Field(0, alias="totalRows")
    valid_rows: int = Field(0, alias="validRows")
    error_rows: int = Field(0, alias="errorRows")
    skip_rows: int = Field(0, alias="skipRows")

    def calculate_stats(self):
        all_rows = self.properties + self.tenants + self.leases + self.payments
        self.total_rows = len(all_rows)
        self.valid_rows = sum(1 for r in all_rows if r.valid and r.action == ImportAction.CREATE)
        self.error_rows = sum(1 for r in all_rows if r.action == ImportAction.ERROR)
        self.skip_rows = sum(1 for r in all_rows if r.action == ImportAction.SKIP)


class ExcelImportResult(BaseModel):
    success: bool = False
    properties_created: int = Field(0, alias="propertiesCreated")
    tenants_created: int = Field(0, alias="tenantsCreated")
    leases_created: int = Field(0, alias="leasesCreated")
    payments_created: int = Field(0, alias="paymentsCreated")
    skipped: int = 0
    errors: int = 0
    error_messages: list[str] = Field(default_factory=list, alias="errorMessages")
