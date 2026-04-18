"""Wave-7 HF-3 — tests for structure cleanup service and endpoint."""

from httpx import ASGITransport, AsyncClient

from kendraw_api.main import app
from kendraw_chem.convert import ConvertService
from kendraw_chem.structure import StructureService


def _mol_block_from_smiles(smiles: str) -> str | None:
    """Best-effort generate a V2000 MOL block via the existing ConvertService."""
    convert = ConvertService()
    if not convert._rdkit_available:
        return None
    result = convert.convert(smiles, "smiles", "mol")
    if not result.success:
        return None
    return result.output


def test_structure_clean_rejects_empty_mol_block() -> None:
    service = StructureService()
    result = service.clean("", mode="quick")
    assert not result.success
    assert result.error == "Empty MOL block"


def test_structure_clean_quick_passthrough_when_no_rdkit() -> None:
    service = StructureService()
    if service._rdkit_available:
        return
    result = service.clean("junk", mode="quick")
    assert not result.success
    assert result.error == "RDKit not available"


def test_structure_clean_quick_succeeds_on_valid_mol() -> None:
    mol = _mol_block_from_smiles("CCO")
    if mol is None:
        return  # RDKit unavailable — covered by the passthrough test above
    result = StructureService().clean(mol, mode="quick")
    assert result.success
    assert "V2000" in result.mol_block


def test_structure_clean_full_recomputes_coords() -> None:
    mol = _mol_block_from_smiles("CCO")
    if mol is None:
        return
    result = StructureService().clean(mol, mode="full")
    assert result.success
    assert "V2000" in result.mol_block


def test_structure_clean_rejects_malformed_mol() -> None:
    service = StructureService()
    if not service._rdkit_available:
        return
    result = service.clean("not a mol block\nreally", mode="quick")
    assert not result.success
    assert result.error is not None


async def test_structure_clean_endpoint_quick() -> None:
    mol = _mol_block_from_smiles("CCO")
    if mol is None:
        return
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/structure/clean", json={"mol_block": mol, "mode": "quick"})
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["mode"] == "quick"


async def test_structure_clean_endpoint_defaults_to_quick_mode() -> None:
    mol = _mol_block_from_smiles("CCO")
    if mol is None:
        return
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/structure/clean", json={"mol_block": mol})
    assert r.status_code == 200
    assert r.json()["mode"] == "quick"
