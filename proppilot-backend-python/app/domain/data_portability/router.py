from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from app.core.dependencies import CurrentUserId, DbSession
from app.domain.data_portability.schemas import ExcelImportPreview, ExcelImportResult
from app.domain.data_portability.service import ExcelImportExportService

router = APIRouter()

EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/export")
async def export_all(
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Export all user data to an Excel file with multiple sheets."""
    service = ExcelImportExportService(db)
    excel_bytes = await service.export_all(owner_id)

    return Response(
        content=excel_bytes,
        media_type=EXCEL_CONTENT_TYPE,
        headers={
            "Content-Disposition": "attachment; filename=mis_datos.xlsx",
        },
    )


@router.get("/template")
async def download_template():
    """Download an empty Excel template with headers and help sheet."""
    service = ExcelImportExportService(None)
    template_bytes = service.generate_template()

    return Response(
        content=template_bytes,
        media_type=EXCEL_CONTENT_TYPE,
        headers={
            "Content-Disposition": "attachment; filename=plantilla_importacion.xlsx",
        },
    )


@router.post("/import/preview", response_model=ExcelImportPreview)
async def preview_import(
    db: DbSession,
    owner_id: CurrentUserId,
    file: UploadFile = File(...),
):
    """Parse Excel file and return preview of what will be imported."""
    service = ExcelImportExportService(db)
    preview = await service.preview_import(file.file, owner_id)
    return preview


@router.post("/import/execute", response_model=ExcelImportResult)
async def execute_import(
    preview: ExcelImportPreview,
    db: DbSession,
    owner_id: CurrentUserId,
):
    """Execute the import after user confirms preview."""
    service = ExcelImportExportService(db)
    result = await service.execute_import(preview, owner_id)
    return result
