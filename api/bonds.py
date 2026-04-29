# api/bonds.py
# FastAPI router — receives OCR results and stores them in Supabase

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import sys, os

# Ensure root is on path when running from uvicorn
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import save_bond_from_ocr
from ocr.ocr_model import extract_bond_from_bytes

router = APIRouter(prefix="/api", tags=["bonds"])


class OCRResult(BaseModel):
    """Pre-processed OCR JSON — Arabic field names matching BondData schema."""
    رقم_السند: str
    تاريخ_الاصدار: str
    اسم_العميل: str
    رقم_الهاتف: str = ""
    ايميل_العميل: str = ""
    وصف_سبب_الصرف: str = ""
    المبلغ: str  # string because OCR returns text — converted to float in database.py


@router.post("/bonds", summary="استقبال JSON من OCR مباشرة")
async def receive_ocr_result(data: OCRResult):
    """
    Accepts pre-processed OCR JSON and stores it in Supabase.
    Use this when OCR runs externally (e.g., Google Colab).
    """
    try:
        saved = save_bond_from_ocr(data.model_dump())
        return {
            "success": True,
            "bond_id": saved["id"],
            "message": "تم حفظ السند بنجاح"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bonds/upload", summary="رفع صورة — OCR + حفظ في خطوة واحدة")
async def upload_and_process(file: UploadFile = File(...)):
    """
    Accepts a bond image, runs Gemini OCR, and saves to Supabase in one step.
    Use this as the primary endpoint for the full pipeline.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="الملف يجب أن يكون صورة (JPG/PNG)")

    try:
        image_bytes = await file.read()
        suffix = ".png" if "png" in file.content_type else ".jpg"
        ocr_data = extract_bond_from_bytes(image_bytes, suffix)
        saved = save_bond_from_ocr(ocr_data)
        return {
            "success": True,
            "bond_id": saved["id"],
            "ocr_data": ocr_data,
            "message": "تم استخراج البيانات وحفظ السند بنجاح"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bonds", summary="جلب كل السندات")
async def list_bonds(status: str = None, limit: int = 50):
    """Returns all bonds, optionally filtered by status."""
    from database import supabase
    query = supabase.table("bonds").select("*, clients(name, email, phone, risk_score)")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).limit(limit).execute()
    return {"bonds": result.data, "count": len(result.data)}
