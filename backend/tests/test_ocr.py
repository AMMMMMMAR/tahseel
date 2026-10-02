from unittest.mock import MagicMock, patch

from app.core.normalization import clean_amount, normalize_arabic_numbers, normalize_date
from app.schemas.ocr import BondExtractionSchema
from app.services.ocr_service import OCRService


def test_arabic_numeral_normalization():
    """Verifies that Eastern Arabic and Persian numbers convert to Western digits."""
    arabic_num_str = "سند رقم ١٠٤٢٥"
    normalized = normalize_arabic_numbers(arabic_num_str)
    assert "10425" in normalized


def test_clean_amount():
    """Verifies amount extraction from mixed Arabic text, currency symbols, and commas."""
    assert clean_amount("٤٥,٠٠٠.٥٠ ريال سعودي") == 45000.50
    assert clean_amount("120,000 SAR") == 120000.0
    assert clean_amount("ر.س 3500") == 3500.0
    assert clean_amount(50000) == 50000.0


def test_normalize_date():
    """Verifies ISO 8601 formatting for various date formats and Arabic digits."""
    assert normalize_date("2026/08/15") == "2026-08-15"
    assert normalize_date("2026.09.05") == "2026-09-05"
    assert normalize_date("٢٠٢٦-١٠-٠١") == "2026-10-01"


def test_bond_extraction_schema():
    """Verifies BondExtractionSchema parsing and legacy dictionary generation."""
    payload = {
        "bond_number": "BOND-990",
        "bond_type": "سند_لأمر",
        "issue_date": "2026-09-01",
        "due_date": "2026-10-01",
        "debtor_name": "شركة الاختبار للتجارة",
        "debtor_phone": "0550001122",
        "debtor_email": "test@domain.sa",
        "amount": 75000.0,
        "currency": "SAR",
        "description": "مستحقات توريد بضائع",
        "confidence_score": 0.98,
        "uncertain_fields": [],
    }
    schema = BondExtractionSchema.model_validate(payload)
    assert schema.bond_number == "BOND-990"
    assert schema.amount == 75000.0
    assert schema.confidence_score == 0.98

    legacy_dict = schema.to_legacy_arabic_dict()
    assert legacy_dict["رقم_السند"] == "BOND-990"
    assert legacy_dict["المبلغ"] == "75000.0"
    assert legacy_dict["اسم_العميل"] == "شركة الاختبار للتجارة"


@patch("app.services.ocr_service.genai.Client")
def test_ocr_service_mocked(mock_client_cls):
    """Mocks Gemini Vision API to test OCRService without external network calls."""
    mock_instance = MagicMock()
    mock_client_cls.return_value = mock_instance
    OCRService._client = mock_instance

    mock_response = MagicMock()
    mock_response.text = """{
        "bond_number": "BOND-MOCK-1",
        "bond_type": "صرف",
        "issue_date": "2026-08-10",
        "due_date": "2026-09-10",
        "debtor_name": "مؤسسة النخبة",
        "debtor_phone": "0512345678",
        "debtor_email": "info@elite.sa",
        "amount": 34000.0,
        "currency": "SAR",
        "description": "دفعة صيانة سنوية",
        "confidence_score": 0.96,
        "uncertain_fields": []
    }"""
    mock_instance.models.generate_content.return_value = mock_response

    # Test with dummy PNG image bytes
    result = OCRService.extract_from_bytes(b"dummy_file_bytes", mime_type="application/pdf")
    assert result.bond_number == "BOND-MOCK-1"
    assert result.amount == 34000.0
    assert result.debtor_name == "مؤسسة النخبة"
    assert result.confidence_score == 0.96


@patch.object(OCRService, "extract_from_bytes")
def test_ocr_endpoint_api(mock_extract, client):
    """Tests POST /api/bonds/ocr with multipart file upload."""
    mock_extract.return_value = BondExtractionSchema(
        bond_number="BOND-API-001",
        bond_type="صرف",
        issue_date="2026-09-01",
        due_date="2026-10-01",
        debtor_name="شركة المدى",
        amount=15000.0,
    )

    response = client.post(
        "/api/bonds/ocr",
        files={"file": ("test.png", b"fake_png_data", "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["extraction"]["bond_number"] == "BOND-API-001"
    assert data["ocr_data"]["اسم_العميل"] == "شركة المدى"
