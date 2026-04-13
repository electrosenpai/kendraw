"""Tests for compute service and API."""

from kendraw_chem.compute import ComputeService


def test_compute_service_stub() -> None:
    """ComputeService returns stub when RDKit unavailable."""
    service = ComputeService()
    result = service.compute_from_smiles("CCO")
    # Stub returns canonical_smiles as the input
    assert result.canonical_smiles == "CCO"


def test_compute_service_mol() -> None:
    """compute_from_mol returns properties for a valid MOL block."""
    service = ComputeService()
    if service._rdkit_available:
        from rdkit import Chem

        mol = Chem.MolFromSmiles("C")
        mol_block = Chem.MolToMolBlock(mol)
        result = service.compute_from_mol(mol_block)
        assert result.formula != ""
        assert result.molecular_weight > 0.0
    else:
        result = service.compute_from_mol("")
        assert result.formula == ""
        assert result.molecular_weight == 0.0
