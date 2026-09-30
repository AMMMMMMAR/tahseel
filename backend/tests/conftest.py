import os
import sys

import pytest

# Ensure backend root is on sys.path for test discovery
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set mock environment variables for secret-less testing
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = "mock_test_key_ai"
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_KEY"] = "mock_service_key"
os.environ["RESEND_API_KEY"] = "re_mock_test_key"
os.environ["FROM_EMAIL"] = "test@tahseel.local"

from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Provides a synchronous TestClient for testing FastAPI routes."""
    return TestClient(app)
