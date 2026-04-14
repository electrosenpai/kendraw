"""Tests for NMR Pydantic response models."""


def _peak(**overrides):  # noqa: ANN003, ANN202
    """Helper to build NmrPeak with sensible defaults."""
    from kendraw_chem.nmr.models import NmrPeak

    defaults = {
        "atom_index": 0,
        "atom_indices": [0],
        "parent_indices": [0],
        "shift_ppm": 7.3,
        "integral": 1,
        "multiplicity": "s",
        "coupling_hz": [],
        "environment": "aromatic",
        "confidence": 3,
        "method": "additive",
    }
    defaults.update(overrides)
    return NmrPeak(**defaults)


def test_nmr_peak_instantiation() -> None:
    """NmrPeak can be created with required fields."""
    peak = _peak(atom_indices=[0, 1], integral=2)
    assert peak.atom_index == 0
    assert peak.atom_indices == [0, 1]
    assert peak.shift_ppm == 7.3
    assert peak.integral == 2
    assert peak.multiplicity == "s"
    assert peak.coupling_hz == []
    assert peak.environment == "aromatic"
    assert peak.confidence == 3
    assert peak.method == "additive"


def test_nmr_peak_with_coupling() -> None:
    """NmrPeak stores multiplicity and coupling values."""
    peak = _peak(
        multiplicity="t",
        coupling_hz=[7.0],
        environment="methyl",
    )
    assert peak.multiplicity == "t"
    assert peak.coupling_hz == [7.0]
    assert peak.environment == "methyl"


def test_nmr_metadata_instantiation() -> None:
    """NmrMetadata can be created with required fields."""
    from kendraw_chem.nmr.models import NmrMetadata

    meta = NmrMetadata(
        engine_version="0.2.0",
        data_version=None,
        method="additive",
    )
    assert meta.engine_version == "0.2.0"
    assert meta.data_version is None
    assert meta.method == "additive"


def test_nmr_prediction_instantiation() -> None:
    """NmrPrediction assembles peaks and metadata."""
    from kendraw_chem.nmr.models import NmrMetadata, NmrPrediction

    prediction = NmrPrediction(
        nucleus="1H",
        solvent="CDCl3",
        peaks=[_peak(shift_ppm=0.9)],
        metadata=NmrMetadata(
            engine_version="0.2.0",
            data_version=None,
            method="additive",
        ),
    )
    assert prediction.nucleus == "1H"
    assert prediction.solvent == "CDCl3"
    assert len(prediction.peaks) == 1
    assert prediction.metadata.method == "additive"


def test_nmr_prediction_serialization() -> None:
    """NmrPrediction serializes to dict with correct structure."""
    from kendraw_chem.nmr.models import NmrMetadata, NmrPrediction

    prediction = NmrPrediction(
        nucleus="1H",
        solvent="DMSO-d6",
        peaks=[_peak(atom_indices=[0, 1], integral=2)],
        metadata=NmrMetadata(
            engine_version="0.2.0",
            data_version=None,
            method="additive",
        ),
    )
    data = prediction.model_dump()
    assert data["nucleus"] == "1H"
    assert data["solvent"] == "DMSO-d6"
    assert len(data["peaks"]) == 1
    assert data["peaks"][0]["shift_ppm"] == 7.3
    assert data["peaks"][0]["multiplicity"] == "s"
    assert data["metadata"]["data_version"] is None
