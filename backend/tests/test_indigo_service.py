"""HF-INDIGO-SETUP — tests for the IndigoService wrapper.

Verifies Indigo loads, parses molecules, computes 2D layout, and serializes
to a V2000 molfile. Also smokes RDKit + Indigo cohabitation in one process.
"""

from __future__ import annotations

import threading

from kendraw_chem.compute import ComputeService
from kendraw_chem.indigo_service import IndigoService


def test_indigo_service_is_available() -> None:
    service = IndigoService()
    assert service.is_available()


def test_indigo_version_is_nonempty() -> None:
    service = IndigoService()
    version = service.version()
    assert version
    arches = ("x86_64", "arm64", "aarch64", "darwin", "windows")
    assert any(arch in version for arch in arches), f"Unexpected version string: {version}"


def test_indigo_load_smiles_returns_v2000_molfile() -> None:
    service = IndigoService()
    mol_block = service.load_molfile("CCO")
    assert "V2000" in mol_block
    assert "INDIGO" in mol_block


def test_indigo_layout_recomputes_coordinates() -> None:
    """Layout should produce non-zero 2D coordinates for benzene's 6 atoms."""
    service = IndigoService()
    laid_out = service.layout_molfile("c1ccccc1")
    assert "V2000" in laid_out
    atom_suffix = " C   0  0  0  0  0  0  0  0  0  0  0  0"
    atom_lines = [ln for ln in laid_out.splitlines() if ln.endswith(atom_suffix)]
    assert len(atom_lines) == 6
    nonzero = [ln for ln in atom_lines if "0.0000    0.0000    0.0000" not in ln]
    assert nonzero, "Indigo layout produced an all-origin structure"


def test_indigo_and_rdkit_cohabit_in_same_process() -> None:
    """RDKit and Indigo must be importable + usable in the same interpreter."""
    indigo = IndigoService()
    rdkit_compute = ComputeService()
    if not indigo.is_available() or not rdkit_compute._rdkit_available:
        return
    # Indigo parse
    indigo_mol = indigo.load_molfile("c1ccccc1")
    assert "V2000" in indigo_mol
    # RDKit parse of same SMILES — separate engine, must not crash
    rdkit_props = rdkit_compute.compute_from_smiles("c1ccccc1")
    assert rdkit_props.canonical_smiles


def test_indigo_thread_local_yields_distinct_instances() -> None:
    """Per Indigo docs, instances are not thread-safe — wrapper must use TLS."""
    service = IndigoService()
    main_id = id(service._instance())
    seen: dict[str, int] = {}

    def grab() -> None:
        seen["other"] = id(service._instance())

    t = threading.Thread(target=grab)
    t.start()
    t.join()
    assert seen["other"] != main_id
