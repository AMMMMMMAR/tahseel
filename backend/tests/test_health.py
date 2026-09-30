def test_health_check(client):
    """Test the /health endpoint returns HTTP 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Tahseel API"
    assert "version" in data


def test_root_endpoint(client):
    """Test the / root endpoint returns welcome info and doc links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "مرحباً بك في Tahseel API" in data["message"]
    assert data["docs"] == "/docs"
    assert len(data["endpoints"]) > 0
