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


def test_version_includes_disclaimer(client: TestClient) -> None:
    """wave-1 P1-10: /version must carry the disclaimer for UI footer display."""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert "disclaimer" in data
    assert "approximate" in data["disclaimer"].lower()


def test_reproducibility_endpoint_returns_fingerprint(client: TestClient) -> None:
    """wave-1 P1-10: /reproducibility exposes commit + engine + stack versions."""
    response = client.get("/reproducibility")
    assert response.status_code == 200
    data = response.json()
    for key in (
        "app_version",
        "commit",
        "nmr_engine_version",
        "python_version",
        "platform",
        "rdkit_version",
        "disclaimer",
    ):
        assert key in data
    assert data["app_version"] == "0.0.0"
    assert data["python_version"].count(".") >= 1  # e.g. "3.13.5"
