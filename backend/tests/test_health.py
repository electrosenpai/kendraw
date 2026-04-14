from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_health_includes_nmr_status(client: TestClient) -> None:
    """QW-3: Health endpoint reports NMR engine status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    nmr = data.get("nmr")
    assert nmr is not None
    assert nmr["method"] == "additive"
    assert "engine_version" in nmr
    assert nmr["environments"] > 0


def test_version_returns_version_and_commit(client: TestClient) -> None:
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "0.0.0"
    assert "commit" in data
    assert isinstance(data["commit"], str)
