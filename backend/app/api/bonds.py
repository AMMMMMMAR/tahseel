from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlmodel import Session

from app.core.db import get_session
from app.ocr.ocr_model import extract_bond_from_bytes
from app.repositories.bond_repo import BondRepository

router = APIRouter(prefix="/api", tags=["bonds"])


class OCRResult(BaseModel):
    """Pre-processed OCR JSON — Arabic field names matching BondData schema."""
    رقم_السند: str
    تاريخ_الاصدار: str
    اسم_العميل: str
    رقم_الهاتف: str = ""
    ايميل_العميل: str = ""
    وصف_سبب_الصرف: str = ""
    المبلغ: str


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


@router.post("/bonds/ocr", summary="استخراج البيانات من الصورة فقط — بدون حفظ")
async def extract_only(file: UploadFile = File(...)):
    """
    Runs Gemini OCR on the uploaded image and returns the extracted JSON.
    Does NOT save to the database — saving happens separately via POST /api/bonds.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="الملف يجب أن يكون صورة (JPG/PNG)")
    try:
        image_bytes = await file.read()
        suffix = ".png" if "png" in file.content_type else ".jpg"
        ocr_data = extract_bond_from_bytes(image_bytes, suffix)
        return {"success": True, "ocr_data": ocr_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bonds/upload", summary="رفع صورة — OCR + حفظ في خطوة واحدة")
async def upload_and_process(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Accepts a bond image, runs Gemini OCR, and saves to the database in one step.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="الملف يجب أن يكون صورة (JPG/PNG)")

    try:
        image_bytes = await file.read()
        suffix = ".png" if "png" in file.content_type else ".jpg"
        ocr_data = extract_bond_from_bytes(image_bytes, suffix)
        saved = BondRepository.save_bond_from_ocr(session, ocr_data)
        return {
            "success": True,
            "bond_id": saved.id,
            "ocr_data": ocr_data,
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
