# ocr/ocr_model.py
# Production-ready OCR — accepts file path, returns structured Arabic JSON
# No Google Colab dependency

import os
import json
from PIL import Image
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini client once at module level
_client = None

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in .env")
        _client = genai.Client(api_key=api_key)
    return _client


# ── Pydantic Schema — forces Gemini to return valid JSON ─────────────────────

class BondData(BaseModel):
    """Schema for Arabic bond/invoice data extraction."""
    رقم_السند: str = Field(description="رقم السند أو الفاتورة")
    تاريخ_الاصدار: str = Field(description="تاريخ الإصدار بصيغة YYYY-MM-DD")
    اسم_العميل: str = Field(description="اسم العميل أو الشركة")
    رقم_الهاتف: str = Field(default="", description="رقم هاتف العميل")
    ايميل_العميل: str = Field(default="", description="البريد الإلكتروني للعميل")
    وصف_سبب_الصرف: str = Field(default="", description="وصف سبب الصرف أو القبض")
    المبلغ: str = Field(description="المبلغ الإجمالي كنص رقمي")


def extract_bond_from_image(image_path: str) -> dict:
    """
    Main OCR function — receives image file path, returns structured dict.
    Called from FastAPI endpoint and Streamlit dashboard.

    Args:
        image_path: Absolute path to the bond image (JPG/PNG)

    Returns:
        dict with Arabic field names matching BondData schema
    """
    client = _get_client()
    image = Image.open(image_path)

    prompt = (
        "أنت خبير في استخراج البيانات من السندات والفواتير العربية. "
        "استخرج جميع البيانات من هذا السند بدقة تامة. "
        "إذا لم تجد حقلاً معيناً، اترك القيمة فارغة."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BondData,
            temperature=0.1,
        ),
    )

    return json.loads(response.text)


def extract_bond_from_bytes(image_bytes: bytes, suffix: str = ".jpg") -> dict:
    """
    Convenience wrapper — accepts raw bytes (from file upload).
    Writes to a temp file internally, then calls extract_bond_from_image.
    """
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        return extract_bond_from_image(tmp_path)
    finally:
        os.unlink(tmp_path)
