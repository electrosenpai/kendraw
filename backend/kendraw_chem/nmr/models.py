"""Pydantic response models for NMR prediction."""

from pydantic import BaseModel


class NmrPeak(BaseModel):
    """A single predicted NMR peak."""

    atom_index: int
    atom_indices: list[int]
    shift_ppm: float
    confidence: int
    method: str


class NmrMetadata(BaseModel):
    """Metadata for an NMR prediction result."""

    engine_version: str
    data_version: str | None
    method: str


class NmrPrediction(BaseModel):
    """Complete NMR prediction response."""

    nucleus: str
    peaks: list[NmrPeak]
    metadata: NmrMetadata
