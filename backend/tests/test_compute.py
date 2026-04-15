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


class TestMolecularDescriptors:
    """Test molecular descriptor calculations (LogP, tPSA, HBD, HBA, Lipinski)."""

    def test_logp_ethanol(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("CCO")
        assert props.logp is not None
        assert -1.5 < props.logp < 0.5  # ethanol LogP ~ -0.3

    def test_tpsa_aspirin(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("CC(=O)Oc1ccccc1C(=O)O")
        assert props.tpsa is not None
        assert 50 < props.tpsa < 80  # aspirin tPSA ~ 63 A²

    def test_hbd_hba_ethanol(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("CCO")
        assert props.hbd == 1  # OH
        assert props.hba == 1  # O

    def test_rotatable_bonds_butane(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("CCCC")
        assert props.rotatable_bonds is not None
        assert props.rotatable_bonds == 1

    def test_lipinski_aspirin_passes(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("CC(=O)Oc1ccccc1C(=O)O")
        assert props.lipinski_pass is True

    def test_lipinski_large_molecule_fails(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        # Large peptide (MW > 500, violates Lipinski)
        smi = (
            "CC(=O)NC(CC(=O)O)C(=O)NC(CC(=O)O)"
            "C(=O)NC(CC(=O)O)C(=O)NC(CC(=O)O)"
            "C(=O)NC(CC(=O)O)C(=O)O"
        )
        props = svc.compute_from_smiles(smi)
        assert props.lipinski_pass is False

    def test_inchi_benzene(self) -> None:
        from kendraw_chem.compute import ComputeService

        svc = ComputeService()
        props = svc.compute_from_smiles("c1ccccc1")
        assert props.inchi.startswith("InChI=1S/C6H6/")
        assert len(props.inchi_key) == 27  # standard InChIKey length
