"""Tests for NMR prediction service orchestrator."""

import pytest


def _rdkit_installed() -> bool:
    try:
        import rdkit  # noqa: F401

        return True
    except ImportError:
        return False


needs_rdkit = pytest.mark.skipif(not _rdkit_installed(), reason="RDKit not installed")


def test_predict_nmr_stub_when_no_rdkit() -> None:
    """Without RDKit, predict_nmr returns stub with empty peaks."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    if not service._rdkit_available:
        result = service.predict_nmr("CCO")
        assert result.nucleus == "1H"
        assert result.peaks == []
        assert result.metadata.method == "unavailable"


@needs_rdkit
def test_predict_nmr_valid_smiles() -> None:
    """predict_nmr with valid SMILES returns NmrPrediction."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    result = service.predict_nmr("CCO")
    assert result.nucleus == "1H"
    assert len(result.peaks) > 0
    assert result.metadata.method == "additive"
    assert result.metadata.engine_version == "0.2.0"
    assert result.solvent == "CDCl3"


@needs_rdkit
def test_predict_nmr_invalid_smiles_raises() -> None:
    """predict_nmr with invalid SMILES raises ValueError."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    with pytest.raises(ValueError, match="Invalid SMILES"):
        service.predict_nmr("INVALID")


@needs_rdkit
def test_predict_nmr_empty_string_raises() -> None:
    """predict_nmr with empty string raises ValueError."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    with pytest.raises(ValueError):
        service.predict_nmr("")


@needs_rdkit
def test_predict_nmr_ethanol_peak_fields() -> None:
    """Ethanol peaks contain all required fields including new ones."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    result = service.predict_nmr("CCO")
    for peak in result.peaks:
        assert isinstance(peak.atom_index, int)
        assert isinstance(peak.shift_ppm, float)
        assert isinstance(peak.integral, int)
        assert peak.integral > 0
        assert isinstance(peak.multiplicity, str)
        assert peak.multiplicity in ("s", "d", "t", "q", "quint", "sext", "sept", "m")
        assert isinstance(peak.coupling_hz, list)
        assert isinstance(peak.environment, str)
        assert peak.confidence in (1, 2, 3)
        assert peak.method == "additive"


@needs_rdkit
def test_predict_nmr_with_solvent() -> None:
    """predict_nmr accepts solvent parameter."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    result = service.predict_nmr("CCO", solvent="DMSO-d6")
    assert result.solvent == "DMSO-d6"
    assert len(result.peaks) > 0


@needs_rdkit
def test_predict_nmr_invalid_solvent_raises() -> None:
    """predict_nmr with invalid solvent raises ValueError."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    with pytest.raises(ValueError, match="Unsupported solvent"):
        service.predict_nmr("CCO", solvent="acetonitrile-d3")


@needs_rdkit
def test_predict_nmr_solvent_affects_shifts() -> None:
    """Different solvents produce different shifts for exchangeable protons."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    cdcl3 = service.predict_nmr("CCO", solvent="CDCl3")
    dmso = service.predict_nmr("CCO", solvent="DMSO-d6")
    # OH peak should shift in DMSO vs CDCl3
    cdcl3_shifts = sorted(p.shift_ppm for p in cdcl3.peaks)
    dmso_shifts = sorted(p.shift_ppm for p in dmso.peaks)
    assert cdcl3_shifts != dmso_shifts


@needs_rdkit
def test_predict_nmr_deterministic() -> None:
    """Same SMILES produces identical predictions."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    r1 = service.predict_nmr("CCO")
    r2 = service.predict_nmr("CCO")
    assert r1 == r2


@needs_rdkit
def test_predict_nmr_mol_format() -> None:
    """predict_nmr accepts MOL block format."""
    from rdkit import Chem

    from kendraw_chem.nmr.nmr_service import NmrService

    mol = Chem.MolFromSmiles("C")
    mol_block = Chem.MolToMolBlock(mol)
    service = NmrService()
    result = service.predict_nmr(mol_block, format="mol")
    assert result.nucleus == "1H"
    assert len(result.peaks) > 0


@needs_rdkit
def test_predict_nmr_unsupported_format_raises() -> None:
    """predict_nmr with unsupported format raises ValueError."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    with pytest.raises(ValueError, match="Unsupported format"):
        service.predict_nmr("CCO", format="inchi")


@needs_rdkit
def test_predict_nmr_atom_count_limit() -> None:
    """predict_nmr raises ValueError when molecule exceeds atom limit."""
    from unittest.mock import patch

    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    # Patch max_mol_atoms to a very low value to trigger the limit
    with patch("kendraw_settings.config.get_settings") as mock_settings:
        mock_settings.return_value.max_mol_atoms = 2
        with pytest.raises(ValueError, match="exceeds limit"):
            service.predict_nmr("CCCCCC")


@needs_rdkit
def test_predict_nmr_invalid_mol_raises() -> None:
    """predict_nmr with invalid MOL block raises ValueError."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    with pytest.raises(ValueError, match="Invalid MOL block"):
        service.predict_nmr("not a mol block", format="mol")
