"""Tests for NMR Pydantic response models."""


def test_nmr_peak_instantiation() -> None:
    """NmrPeak can be created with required fields."""
    from kendraw_chem.nmr.models import NmrPeak

    peak = NmrPeak(
        atom_index=0,
        atom_indices=[0, 1],
        shift_ppm=7.3,
        confidence=3,
        method="additive",
    )
    assert peak.atom_index == 0
    assert peak.atom_indices == [0, 1]
    assert peak.shift_ppm == 7.3
    assert peak.confidence == 3
    assert peak.method == "additive"


def test_nmr_metadata_instantiation() -> None:
    """NmrMetadata can be created with required fields."""
    from kendraw_chem.nmr.models import NmrMetadata

    meta = NmrMetadata(
        engine_version="0.1.0",
        data_version=None,
        method="additive",
    )
    assert meta.engine_version == "0.1.0"
    assert meta.data_version is None
    assert meta.method == "additive"


def test_nmr_prediction_instantiation() -> None:
    """NmrPrediction assembles peaks and metadata."""
    from kendraw_chem.nmr.models import NmrMetadata, NmrPeak, NmrPrediction

    prediction = NmrPrediction(
        nucleus="1H",
        peaks=[
            NmrPeak(
                atom_index=0,
                atom_indices=[0],
                shift_ppm=0.9,
                confidence=3,
                method="additive",
            ),
        ],
        metadata=NmrMetadata(
            engine_version="0.1.0",
            data_version=None,
            method="additive",
        ),
    )
    assert prediction.nucleus == "1H"
    assert len(prediction.peaks) == 1
    assert prediction.metadata.method == "additive"


def test_nmr_prediction_serialization() -> None:
    """NmrPrediction serializes to dict with correct structure."""
    from kendraw_chem.nmr.models import NmrMetadata, NmrPeak, NmrPrediction

    prediction = NmrPrediction(
        nucleus="1H",
        peaks=[
            NmrPeak(
                atom_index=0,
                atom_indices=[0, 1],
                shift_ppm=7.3,
                confidence=3,
                method="additive",
            ),
        ],
        metadata=NmrMetadata(
            engine_version="0.1.0",
            data_version=None,
            method="additive",
        ),
    )
    data = prediction.model_dump()
    assert data["nucleus"] == "1H"
    assert len(data["peaks"]) == 1
    assert data["peaks"][0]["shift_ppm"] == 7.3
    assert data["metadata"]["data_version"] is None
