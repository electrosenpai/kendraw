"""Tests for NMR prediction API endpoint."""

from httpx import ASGITransport, AsyncClient

from kendraw_api.main import app


async def test_nmr_endpoint_valid_smiles() -> None:
    """POST /compute/nmr with valid SMILES returns 200 with prediction."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/compute/nmr",
            json={"input": "CCO", "format": "smiles", "nucleus": "1H"},
        )
    assert r.status_code == 200
    data = r.json()
    assert "peaks" in data
    assert "metadata" in data
    assert data["metadata"]["method"] in ("additive", "unavailable")
    assert data["nucleus"] == "1H"


async def test_nmr_endpoint_default_params() -> None:
    """POST /compute/nmr with only input uses default format and nucleus."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/compute/nmr", json={"input": "C"})
    assert r.status_code == 200
    data = r.json()
    assert "peaks" in data


async def test_nmr_endpoint_invalid_smiles_returns_400() -> None:
    """POST /compute/nmr with invalid SMILES returns 400."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/compute/nmr",
            json={"input": "INVALID", "format": "smiles", "nucleus": "1H"},
        )
    # Without RDKit, service returns stub (200). With RDKit, invalid SMILES → 400.
    from kendraw_chem.nmr import NmrService

    service = NmrService()
    if service._rdkit_available:
        assert r.status_code == 400
        assert "detail" in r.json()
    else:
        # Stub mode returns 200 with empty peaks for any input
        assert r.status_code == 200


async def test_nmr_endpoint_unsupported_nucleus_returns_400() -> None:
    """POST /compute/nmr with unsupported nucleus returns 400."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/compute/nmr",
            json={"input": "CCO", "format": "smiles", "nucleus": "13C"},
        )
    assert r.status_code == 400
    assert "Unsupported nucleus" in r.json()["detail"]


async def test_nmr_endpoint_response_structure() -> None:
    """Response JSON matches NmrPrediction schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/compute/nmr",
            json={"input": "CCO", "format": "smiles", "nucleus": "1H"},
        )
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["peaks"], list)
    assert isinstance(data["metadata"], dict)
    assert "engine_version" in data["metadata"]
    assert "method" in data["metadata"]


async def test_nmr_endpoint_in_openapi() -> None:
    """NMR endpoint appears in OpenAPI schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/openapi.json")
    assert r.status_code == 200
    schema = r.json()
    assert "/compute/nmr" in schema["paths"]
    nmr_path = schema["paths"]["/compute/nmr"]
    assert "post" in nmr_path


async def test_nmr_endpoint_atom_limit_returns_413() -> None:
    """POST /compute/nmr with molecule exceeding atom limit returns 413."""
    from unittest.mock import patch

    from kendraw_chem.nmr import NmrService

    service = NmrService()
    if not service._rdkit_available:
        return  # Can't test atom limit without RDKit

    with patch("kendraw_settings.config.get_settings") as mock_settings:
        mock_settings.return_value.max_mol_atoms = 2
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/compute/nmr",
                json={"input": "CCCCCC", "format": "smiles", "nucleus": "1H"},
            )
        assert r.status_code == 413
        assert "exceeds limit" in r.json()["detail"]


async def test_nmr_endpoint_stub_returns_200() -> None:
    """When RDKit is unavailable, endpoint returns 200 with empty peaks."""
    from kendraw_chem.nmr import NmrService

    service = NmrService()
    if not service._rdkit_available:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/compute/nmr",
                json={"input": "CCO", "format": "smiles", "nucleus": "1H"},
            )
        assert r.status_code == 200
        data = r.json()
        assert data["peaks"] == []
        assert data["metadata"]["method"] == "unavailable"
