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
    assert result.metadata.engine_version == "0.1.0"


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
    """Ethanol peaks contain all required fields."""
    from kendraw_chem.nmr.nmr_service import NmrService

    service = NmrService()
    result = service.predict_nmr("CCO")
    for peak in result.peaks:
        assert isinstance(peak.atom_index, int)
        assert isinstance(peak.shift_ppm, float)
        assert peak.confidence in (1, 2, 3)
        assert peak.method == "additive"


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
