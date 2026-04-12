"""Tests for compute service and API."""

from kendraw_chem.compute import ComputeService


def test_compute_service_stub() -> None:
    """ComputeService returns stub when RDKit unavailable."""
    service = ComputeService()
    result = service.compute_from_smiles("CCO")
    # Stub returns canonical_smiles as the input
    assert result.canonical_smiles == "CCO"


def test_compute_service_mol_stub() -> None:
    """compute_from_mol returns empty stub without RDKit."""
    service = ComputeService()
    result = service.compute_from_mol("")
    assert result.formula == ""
    assert result.molecular_weight == 0.0
