import re
from typing import Any

# Translation table for Eastern Arabic and Persian numerals to Western digits
ARABIC_NUMERALS_TABLE = str.maketrans({
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
})


def normalize_arabic_numbers(text: str) -> str:
    """
    Converts Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to standard Western digits (0123456789)
    and cleans comma separators.
    """
    if not text:
        return ""
    converted = str(text).translate(ARABIC_NUMERALS_TABLE)
    # Replace Arabic comma '،' when used as decimal or separator
    converted = converted.replace("،", ",")
    return converted.strip()


def clean_amount(raw_amount: Any) -> float:
    """
    Extracts a clean numeric float from raw input, removing currency symbols,
    thousand separators, and Arabic words.
    """
    if isinstance(raw_amount, (int, float)):
        return float(raw_amount)

    text = normalize_arabic_numbers(str(raw_amount))

    # Strip known currency abbreviations and symbols first (e.g. ر.س or SAR)
    currency_patterns = [
        r"ر\.س\.?",
        r"ريال(\s+سعودي)?",
        r"SAR",
        r"SR",
        r"AED",
        r"درهم",
        r"USD",
        r"\$",
    ]
    for pattern in currency_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # Remove any remaining non-digit characters except dots and commas
    text = re.sub(r"[^\d.,]", "", text)

    # Handle comma as decimal or thousand separator
    if "," in text and "." in text:
        # e.g., 45,000.50
        text = text.replace(",", "")
    elif "," in text and "." not in text:
        # e.g. 45,000 vs 45,50
        parts = text.split(",")
        if len(parts[-1]) == 2:
            text = text.replace(",", ".")
        else:
            text = text.replace(",", "")

    try:
        return float(text) if text else 0.0
    except ValueError:
        return 0.0


def normalize_date(date_str: str) -> str:
    """
    Normalizes date string to YYYY-MM-DD ISO format, handling various slash/dash formats
    and Eastern Arabic numbers.
    """
    if not date_str:
        return "2026-01-01"

    text = normalize_arabic_numbers(date_str)
    # Extract matches for YYYY-MM-DD or DD/MM/YYYY or YYYY/MM/DD
    match = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", text)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    match_reverse = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", text)
    if match_reverse:
        day, month, year = match_reverse.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    return text.strip()
