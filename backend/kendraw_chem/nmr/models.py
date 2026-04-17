"""Pydantic response models for NMR prediction."""

from pydantic import BaseModel


class NmrPeak(BaseModel):
    """A single predicted NMR peak."""

    atom_index: int
    atom_indices: list[int]
    parent_indices: list[int]
    shift_ppm: float
    sigma_ppm: float | None = None
    integral: int
    multiplicity: str
    coupling_hz: list[float]
    environment: str
    confidence: int
    method: str
    proton_group_id: int = 0
    dept_class: str | None = None
    d2o_exchangeable: bool = False


class NmrMetadata(BaseModel):
    """Metadata for an NMR prediction result."""

    engine_version: str
    data_version: str | None
    method: str
    schema_version: str = "1.1"


class NmrPrediction(BaseModel):
    """Complete NMR prediction response."""

    nucleus: str
    solvent: str
    peaks: list[NmrPeak]
    metadata: NmrMetadata
