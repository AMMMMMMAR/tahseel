import io
import json
import os
from typing import Optional

from google import genai
from google.genai import types
from PIL import Image
from sqlmodel import Session

from app.core.normalization import clean_amount, normalize_arabic_numbers, normalize_date
from app.models.bond import Bond
from app.repositories.bond_repo import BondRepository
from app.schemas.ocr import BondExtractionSchema

SYSTEM_PROMPT = """
أنت نظام ذكاء اصطناعي متخصص في فحص واستخراج البيانات من السندات المالية والتجارية العربية (سند لأمر، سند قبض، سند صرف، فواتير تجارية، وكمبيالات).
مهمتك:
1. استخراج رقم السند وتاريخ الإصدار وتاريخ الاستحقاق بدقة.
2. استخراج اسم المدين/العميل ورقم هاتفه وبريده إن وجد.
3. استخراج المبلغ الصافي كرقم حسابي وتحديد العملة (افتراضياً SAR).
4. استخراج بيان وسبب الصرف أو تفاصيل الالتزام.
5. تقييم وضوح الخط والمستند ووضع درجة ثقة من 0.0 إلى 1.0، وتحديد أي حقول غير مؤكدة في قائمة uncertain_fields.
إذا لم تجد حقلاً معيناً، اتركه فارغاً.
"""


class OCRService:
    _client: Optional[genai.Client] = None

    @classmethod
    def get_client(cls) -> genai.Client:
        """Initializes and returns the singleton Google Gemini GenAI client."""
        if cls._client is None:
            api_key = os.getenv("GEMINI_API_KEY", "")
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set in environment.")
            # Sync GOOGLE_API_KEY so OS environment dummy keys don't conflict
            os.environ["GOOGLE_API_KEY"] = api_key
            cls._client = genai.Client(api_key=api_key)
        return cls._client

    @classmethod
    def extract_from_bytes(
        cls,
        file_bytes: bytes,
        mime_type: str = "image/jpeg"
    ) -> BondExtractionSchema:
        """
        Extracts structured Arabic bond entities from raw image or PDF bytes.
        Supports: image/jpeg, image/png, image/webp, and application/pdf with multi-model fallback.
        """
        client = cls.get_client()

        # Prepare content parts
        contents = []

        if "pdf" in mime_type.lower():
            # Native PDF Part ingestion
            pdf_part = types.Part.from_bytes(
                data=file_bytes,
                mime_type="application/pdf"
            )
            contents.append(pdf_part)
        else:
            # Image ingestion via PIL
            image = Image.open(io.BytesIO(file_bytes))
            contents.append(image)

        contents.append(SYSTEM_PROMPT)

        candidate_models = list(dict.fromkeys([
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-2.0-flash",
        ]))

        response = None
        last_err = None

        for m in candidate_models:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=BondExtractionSchema,
                        temperature=0.1,
                    ),
                )
                if response and response.text:
                    break
            except Exception as e:
                last_err = e
                logger.warning(f"OCR model {m} failed: {e}. Trying next model...")

        if response is None or not response.text:
            raise last_err or RuntimeError("فشل استخراج البيانات من جميع نماذج الرؤية المتاحة.")

        raw_json = json.loads(response.text)
        result = BondExtractionSchema.model_validate(raw_json)

        # Apply normalization guardrails
        result.bond_number = normalize_arabic_numbers(result.bond_number)
        result.issue_date = normalize_date(result.issue_date)
        if result.due_date:
            result.due_date = normalize_date(result.due_date)
        result.amount = clean_amount(result.amount)

        return result

    @classmethod
    def extract_and_save(
        cls,
        session: Session,
        file_bytes: bytes,
        mime_type: str = "image/jpeg"
    ) -> Bond:
        """
        Extracts structured data from document bytes and immediately persists
        the debtor client and bond in the database.
        """
        extraction = cls.extract_from_bytes(file_bytes, mime_type)
        legacy_dict = extraction.to_legacy_arabic_dict()
        return BondRepository.save_bond_from_ocr(session, legacy_dict)
