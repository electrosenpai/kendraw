"""Tests for convert service and API."""

from kendraw_chem.convert import ConvertService


def test_convert_unsupported_input_format() -> None:
    """Returns error for unsupported input format."""
    service = ConvertService()
    result = service.convert("data", "xyz", "smiles")
    assert not result.success
    assert result.error is not None
    assert "Unsupported input format" in result.error


def test_convert_unsupported_output_format() -> None:
    """Returns error for unsupported output format."""
    service = ConvertService()
    result = service.convert("C", "smiles", "xyz")
    assert not result.success
    assert result.error is not None
    assert "Unsupported output format" in result.error


def test_convert_without_rdkit() -> None:
    """Without RDKit, conversion returns unavailable error."""
    service = ConvertService()
    if not service._rdkit_available:
        result = service.convert("C", "smiles", "mol")
        assert not result.success
        assert result.error == "RDKit not available"
