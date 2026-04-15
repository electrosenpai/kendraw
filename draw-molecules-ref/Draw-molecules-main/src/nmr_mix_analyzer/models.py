"""Shared data models for NMR spectra, peaks, and compound references."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np


@dataclass(slots=True)
class Spectrum:
    """Container for a single 1D NMR spectrum."""

    ppm: np.ndarray
    intensity: np.ndarray
    nucleus: str = "1H"
    sample_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    is_frequency_domain: bool = True
    fid: np.ndarray | None = None
    time_axis: np.ndarray | None = None

    def copy(self) -> "Spectrum":
        """Return a copy suitable for preprocessing steps."""
        return Spectrum(
            ppm=np.array(self.ppm, copy=True),
            intensity=np.array(self.intensity, copy=True),
            nucleus=self.nucleus,
            sample_id=self.sample_id,
            metadata=dict(self.metadata),
            is_frequency_domain=self.is_frequency_domain,
            fid=None if self.fid is None else np.array(self.fid, copy=True),
            time_axis=None if self.time_axis is None else np.array(self.time_axis, copy=True),
        )


@dataclass(slots=True)
class Peak:
    """Description of a detected resonance peak."""

    ppm: float
    intensity: float
    left_ppm: float
    right_ppm: float
    area: float
    snr: float
    width_hz: float | None = None
    multiplicity: str = "m"
    j_couplings_hz: list[float] = field(default_factory=list)


@dataclass(slots=True)
class ReferencePeak:
    """Reference information for one expected peak of a compound."""

    shift: float
    multiplicity: str | None = None
    relative_intensity: float | None = None
    note: str | None = None


@dataclass(slots=True)
class CompoundReference:
    """Reference entry from a spectral library."""

    name: str
    nucleus: str
    peaks: list[ReferencePeak]
    source: str = "custom"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class CompoundMatch:
    """Identification result for a candidate compound."""

    compound_name: str
    nucleus: str
    score: float
    confidence: str
    matched_peaks: list[tuple[ReferencePeak, Peak]]
    missing_reference_peaks: list[ReferencePeak]
    source: str = "custom"
    metadata: dict[str, Any] = field(default_factory=dict)
