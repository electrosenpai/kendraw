"""HF-D2 — tests for IndigoService.fuse_template_* + /structure/fuse-template.

Covers:
  - atom fusion: methyl + benzene → toluene
  - bond fusion: benzene + benzene → naphthalene
  - HTTP endpoint with both modes and validation errors
  - Layout produces non-degenerate 2D coordinates after fusion
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from kendraw_api.main import create_app
from kendraw_chem.indigo_service import IndigoService


@pytest.fixture
def indigo() -> IndigoService:
    svc = IndigoService()
    if not svc.is_available():
        pytest.skip("Indigo not installed")
    return svc


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())


def _ethane_mol_block(svc: IndigoService) -> str:
    return svc.load_molfile("CC")


def _benzene_mol_block(svc: IndigoService) -> str:
    return svc.load_molfile("c1ccccc1")


def _canonical(svc: IndigoService, mol_block: str) -> str:
    from indigo import Indigo  # type: ignore[import-untyped]

    mol = Indigo().loadMolecule(mol_block)
    return str(mol.canonicalSmiles())


def test_fuse_atom_methyl_plus_benzene_gives_toluene(indigo: IndigoService) -> None:
    scene = _ethane_mol_block(indigo)
    fused = indigo.fuse_template_atom(scene, "c1ccccc1", scene_atom_index=0)
    canonical = _canonical(indigo, fused)
    assert canonical == "Cc1ccccc1", f"expected toluene, got {canonical!r}"


def test_fuse_bond_benzene_plus_benzene_gives_naphthalene(indigo: IndigoService) -> None:
    scene = _benzene_mol_block(indigo)
    fused = indigo.fuse_template_bond(scene, "c1ccccc1", scene_bond_index=0)
    canonical = _canonical(indigo, fused)
    assert canonical == "c1cccc2ccccc21", f"expected naphthalene, got {canonical!r}"


def test_fuse_atom_layout_produces_nonzero_coords(indigo: IndigoService) -> None:
    scene = _ethane_mol_block(indigo)
    fused = indigo.fuse_template_atom(scene, "c1ccccc1", scene_atom_index=0)
    assert "V2000" in fused
    atom_suffix = " C   0  0  0  0  0  0  0  0  0  0  0  0"
    atom_lines = [ln for ln in fused.splitlines() if ln.endswith(atom_suffix)]
    assert len(atom_lines) == 7  # 1 (CH4 leftover) + 6 benzene = 7 carbons
    nonzero = [ln for ln in atom_lines if "0.0000    0.0000    0.0000" not in ln]
    assert len(nonzero) >= 6, "Indigo layout should place at least 6 of 7 atoms off-origin"


def test_fuse_atom_invalid_index_raises(indigo: IndigoService) -> None:
    scene = _ethane_mol_block(indigo)
    with pytest.raises(IndexError):
        indigo.fuse_template_atom(scene, "c1ccccc1", scene_atom_index=99)


def test_fuse_bond_invalid_index_raises(indigo: IndigoService) -> None:
    scene = _benzene_mol_block(indigo)
    with pytest.raises(IndexError):
        indigo.fuse_template_bond(scene, "c1ccccc1", scene_bond_index=99)


def test_fuse_bond_template_anchors_must_differ(indigo: IndigoService) -> None:
    scene = _benzene_mol_block(indigo)
    with pytest.raises(ValueError, match="differ"):
        indigo.fuse_template_bond(
            scene,
            "c1ccccc1",
            scene_bond_index=0,
            template_anchor_a_index=0,
            template_anchor_b_index=0,
        )


def test_endpoint_atom_fusion_returns_toluene(
    client: TestClient,
    indigo: IndigoService,
) -> None:
    scene = _ethane_mol_block(indigo)
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": scene,
            "template_smiles": "c1ccccc1",
            "mode": "atom",
            "target_index": 0,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert _canonical(indigo, body["mol_block"]) == "Cc1ccccc1"


def test_endpoint_bond_fusion_returns_naphthalene(
    client: TestClient,
    indigo: IndigoService,
) -> None:
    scene = _benzene_mol_block(indigo)
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": scene,
            "template_smiles": "c1ccccc1",
            "mode": "bond",
            "target_index": 0,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert _canonical(indigo, body["mol_block"]) == "c1cccc2ccccc21"


def test_endpoint_rejects_empty_mol_block(client: TestClient) -> None:
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": "",
            "template_smiles": "c1ccccc1",
            "mode": "atom",
            "target_index": 0,
        },
    )
    assert res.status_code == 400


def test_endpoint_rejects_empty_template(client: TestClient, indigo: IndigoService) -> None:
    scene = _ethane_mol_block(indigo)
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": scene,
            "template_smiles": "  ",
            "mode": "atom",
            "target_index": 0,
        },
    )
    assert res.status_code == 400


def test_endpoint_rejects_out_of_range_index(client: TestClient, indigo: IndigoService) -> None:
    scene = _ethane_mol_block(indigo)
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": scene,
            "template_smiles": "c1ccccc1",
            "mode": "atom",
            "target_index": 99,
        },
    )
    assert res.status_code == 400


def test_endpoint_custom_template_anchors_atom(
    client: TestClient,
    indigo: IndigoService,
) -> None:
    """Anchor at template atom 2 of pyridine — still a valid atom-fusion."""
    scene = _ethane_mol_block(indigo)
    res = client.post(
        "/structure/fuse-template",
        json={
            "mol_block": scene,
            "template_smiles": "n1ccccc1",
            "mode": "atom",
            "target_index": 0,
            "template_anchors": [2],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    # Result should contain pyridine ring + methyl substituent.
    canonical = _canonical(indigo, body["mol_block"])
    assert "n" in canonical and "c" in canonical and "C" in canonical
