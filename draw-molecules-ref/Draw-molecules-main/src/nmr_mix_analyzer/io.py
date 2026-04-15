"""Data loading utilities for NMR spectra and reference libraries."""

from __future__ import annotations

from collections import defaultdict
import json
from pathlib import Path

import nmrglue as ng
import numpy as np
import pandas as pd

from .models import CompoundReference, ReferencePeak, Spectrum


def load_spectrum(path: str | Path, nucleus: str = "1H", sample_id: str | None = None) -> Spectrum:
    """Load a spectrum from CSV, Bruker, JCAMP-DX, or NMRPipe."""
    path = Path(path)
    suffix = path.suffix.lower()

    if path.is_dir():
        return load_bruker(path, nucleus=nucleus, sample_id=sample_id)
    if suffix in {".csv", ".txt"}:
        return load_csv(path, nucleus=nucleus, sample_id=sample_id)
    if suffix in {".dx", ".jdx", ".jcamp"}:
        return load_jcamp(path, nucleus=nucleus, sample_id=sample_id)
    if suffix in {".ft", ".fid", ".pipe"}:
        return load_nmrpipe(path, nucleus=nucleus, sample_id=sample_id)
    raise ValueError(f"Unsupported spectrum format: {path}")


def load_csv(path: str | Path, nucleus: str = "1H", sample_id: str | None = None) -> Spectrum:
    """Load a simple chemical shift/intensity CSV file."""
    df = pd.read_csv(path)
    if df.shape[1] < 2:
        raise ValueError("CSV input must contain at least two columns: ppm and intensity.")

    ppm = df.iloc[:, 0].to_numpy(dtype=float)
    intensity = df.iloc[:, 1].to_numpy(dtype=float)
    order = np.argsort(ppm)
    return Spectrum(
        ppm=ppm[order],
        intensity=intensity[order],
        nucleus=nucleus,
        sample_id=sample_id or Path(path).stem,
        metadata={"source_path": str(path), "format": "csv"},
    )


def load_bruker(path: str | Path, nucleus: str = "1H", sample_id: str | None = None) -> Spectrum:
    """Load Bruker data, preserving raw FID when available."""
    dic, data = ng.bruker.read(str(path))
    udic = ng.bruker.guess_udic(dic, data)
    axis = ng.fileiobase.uc_from_udic(udic, 0)
    ppm = np.asarray(axis.ppm_scale(), dtype=float)
    is_frequency_domain = not np.iscomplexobj(data)

    return Spectrum(
        ppm=ppm,
        intensity=np.real(np.asarray(data, dtype=float)) if is_frequency_domain else np.zeros_like(ppm),
        nucleus=nucleus,
        sample_id=sample_id or Path(path).name,
        metadata={"source_path": str(path), "format": "bruker", "udic": udic, "dic": dic},
        is_frequency_domain=is_frequency_domain,
        fid=np.asarray(data) if not is_frequency_domain else None,
        time_axis=np.arange(data.size, dtype=float) if not is_frequency_domain else None,
    )


def load_jcamp(path: str | Path, nucleus: str = "1H", sample_id: str | None = None) -> Spectrum:
    """Load a JCAMP-DX spectrum via nmrglue."""
    dic, data = ng.jcampdx.read(str(path))
    ppm = np.asarray(dic.get("xaxis"))
    intensity = np.asarray(dic.get("yaxis", data))

    if ppm.size == 0:
        ppm = np.linspace(0.0, float(data.size - 1), num=data.size)
    order = np.argsort(ppm)
    return Spectrum(
        ppm=ppm[order],
        intensity=intensity[order],
        nucleus=nucleus,
        sample_id=sample_id or Path(path).stem,
        metadata={"source_path": str(path), "format": "jcamp", "dic": dic},
    )


def load_nmrpipe(path: str | Path, nucleus: str = "1H", sample_id: str | None = None) -> Spectrum:
    """Load an NMRPipe spectrum or FID."""
    dic, data = ng.pipe.read(str(path))
    udic = ng.pipe.guess_udic(dic, data)
    axis = ng.fileiobase.uc_from_udic(udic, 0)
    ppm = np.asarray(axis.ppm_scale(), dtype=float)
    is_frequency_domain = not np.iscomplexobj(data)

    return Spectrum(
        ppm=ppm,
        intensity=np.real(np.asarray(data, dtype=float)) if is_frequency_domain else np.zeros_like(ppm),
        nucleus=nucleus,
        sample_id=sample_id or Path(path).stem,
        metadata={"source_path": str(path), "format": "nmrpipe", "udic": udic, "dic": dic},
        is_frequency_domain=is_frequency_domain,
        fid=np.asarray(data) if not is_frequency_domain else None,
        time_axis=np.arange(data.size, dtype=float) if not is_frequency_domain else None,
    )


def load_reference_library(path: str | Path) -> list[CompoundReference]:
    """Load a custom reference library from JSON or CSV."""
    path = Path(path)
    suffix = path.suffix.lower()
    if suffix == ".json":
        return _load_reference_library_json(path)
    if suffix == ".csv":
        return _load_reference_library_csv(path)
    raise ValueError(f"Unsupported reference library format: {path}")


def _load_reference_library_json(path: Path) -> list[CompoundReference]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    references: list[CompoundReference] = []
    for entry in raw:
        peaks = [
            ReferencePeak(
                shift=float(peak["shift"]),
                multiplicity=peak.get("multiplicity"),
                relative_intensity=None if peak.get("relative_intensity") is None else float(peak["relative_intensity"]),
                note=peak.get("note"),
            )
            for peak in entry["peaks"]
        ]
        references.append(
            CompoundReference(
                name=entry["name"],
                nucleus=entry.get("nucleus", "1H"),
                peaks=peaks,
                source=entry.get("source", "custom"),
                metadata=entry.get("metadata", {}),
            )
        )
    return references


def _load_reference_library_csv(path: Path) -> list[CompoundReference]:
    df = pd.read_csv(path)
    grouped: dict[tuple[str, str, str], list[ReferencePeak]] = defaultdict(list)
    metadata_map: dict[tuple[str, str, str], dict[str, str]] = {}

    for record in df.to_dict(orient="records"):
        key = (
            str(record["compound"]),
            str(record.get("nucleus", "1H")),
            str(record.get("source", "custom")),
        )
        grouped[key].append(
            ReferencePeak(
                shift=float(record["shift"]),
                multiplicity=None if pd.isna(record.get("multiplicity")) else str(record.get("multiplicity")),
                relative_intensity=None if pd.isna(record.get("relative_intensity")) else float(record["relative_intensity"]),
                note=None if pd.isna(record.get("note")) else str(record.get("note")),
            )
        )
        metadata_map[key] = {
            k: v
            for k, v in record.items()
            if k not in {"compound", "nucleus", "source", "shift", "multiplicity", "relative_intensity", "note"}
            and not pd.isna(v)
        }

    return [
        CompoundReference(name=name, nucleus=nucleus, peaks=peaks, source=source, metadata=metadata_map[(name, nucleus, source)])
        for (name, nucleus, source), peaks in grouped.items()
    ]
