from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlmodel import Session

from app.core.db import get_session
from app.repositories.bond_repo import BondRepository
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/api", tags=["bonds"])


class OCRResult(BaseModel):
    """Pre-processed OCR JSON — Arabic field names matching legacy schema."""

    رقم_السند: str
    تاريخ_الاصدار: str
    اسم_العميل: str
    رقم_الهاتف: str = ""
    ايميل_العميل: str = ""
    وصف_سبب_الصرف: str = ""
    المبلغ: str


def _validate_document_mime(content_type: Optional[str]) -> str:
    """Validates that uploaded file is an image or PDF."""
    mime = (content_type or "image/jpeg").lower()
    if not (mime.startswith("image/") or "pdf" in mime):
        raise HTTPException(
            status_code=400,
            detail="نوع الملف غير مدعوم. يرجى رفع صورة (JPG/PNG/WEBP) أو ملف PDF."
        )
    return mime


@router.post("/bonds", summary="استقبال JSON من OCR وحفظ السند")
async def receive_ocr_result(
    data: OCRResult,
    session: Session = Depends(get_session)
):
    """
    Accepts pre-processed OCR JSON and stores it in the database.
    """
    try:
        saved = BondRepository.save_bond_from_ocr(session, data.model_dump())
        return {
            "success": True,
            "bond_id": saved.id,
            "message": "تم حفظ السند بنجاح"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bonds/ocr", summary="استخراج البيانات من المستند (صورة أو PDF) — بدون حفظ")
async def extract_only(file: UploadFile = File(...)):
    """
    Runs Gemini 2.5 Flash Multi-Modal OCR on uploaded image or PDF and returns structured data.
    Does NOT save to the database — saving happens separately via POST /api/bonds.
    """
    mime = _validate_document_mime(file.content_type)
    try:
        file_bytes = await file.read()
        extraction = OCRService.extract_from_bytes(file_bytes, mime)
        return {
            "success": True,
            "extraction": extraction.model_dump(),
            "ocr_data": extraction.to_legacy_arabic_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bonds/upload", summary="رفع مستند — OCR + حفظ في خطوة واحدة")
async def upload_and_process(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Accepts a bond image or PDF, runs Gemini OCR, and saves directly to the database.
    """
    mime = _validate_document_mime(file.content_type)
    try:
        file_bytes = await file.read()
        saved = OCRService.extract_and_save(session, file_bytes, mime)
        extraction = OCRService.extract_from_bytes(file_bytes, mime)
        return {
            "success": True,
            "bond_id": saved.id,
            "extraction": extraction.model_dump(),
            "ocr_data": extraction.to_legacy_arabic_dict(),
            "message": "تم استخراج البيانات وحفظ السند بنجاح"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bonds", summary="جلب كل السندات")
async def list_bonds(
    status: Optional[str] = None,
    limit: int = 50,
    session: Session = Depends(get_session)
):
    """Returns all bonds, optionally filtered by status, with attached client details."""
    bonds = BondRepository.list_bonds(session, status=status, limit=limit)
    response_bonds = []
    for b in bonds:
        b_dict = b.model_dump()
        b_dict["clients"] = b.client.model_dump() if b.client else None
        response_bonds.append(b_dict)
    return {"bonds": response_bonds, "count": len(response_bonds)}
