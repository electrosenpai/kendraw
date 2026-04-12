"""Tests for API endpoint routes."""

from httpx import ASGITransport, AsyncClient

from kendraw_api.main import app


async def test_health() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


async def test_version() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/version")
    assert r.status_code == 200
    data = r.json()
    assert "version" in data


async def test_compute_smiles_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/compute/properties/smiles", json={"smiles": "CCO"})
    assert r.status_code == 200
    data = r.json()
    assert "canonical_smiles" in data


async def test_convert_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/convert/",
            json={
                "input_data": "C",
                "input_format": "smiles",
                "output_format": "mol",
            },
        )
    assert r.status_code == 200
    data = r.json()
    assert "success" in data
