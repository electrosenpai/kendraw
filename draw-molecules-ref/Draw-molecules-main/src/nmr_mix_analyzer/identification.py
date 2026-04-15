"""Compound identification against reference spectral libraries."""

from __future__ import annotations

from collections import defaultdict

import numpy as np

from .models import CompoundMatch, CompoundReference, Peak, ReferencePeak, Spectrum


def identify_compounds(
    spectrum: Spectrum,
    detected_peaks: list[Peak],
    library: list[CompoundReference],
    chemical_shift_tolerance: float | None = None,
    min_score: float = 0.45,
) -> list[CompoundMatch]:
    """Match detected peaks against a single-nucleus library."""
    tolerance = chemical_shift_tolerance or _default_shift_tolerance(spectrum.nucleus)
    matches: list[CompoundMatch] = []
    for reference in library:
        if reference.nucleus != spectrum.nucleus:
            continue
        match = _score_reference(reference, detected_peaks, tolerance=tolerance)
        if match.score >= min_score:
            matches.append(match)
    return sorted(matches, key=lambda match: match.score, reverse=True)


def identify_joint_spectra(
    proton_spectrum: Spectrum | None,
    carbon_spectrum: Spectrum | None,
    proton_peaks: list[Peak] | None,
    carbon_peaks: list[Peak] | None,
    library: list[CompoundReference],
    min_score: float = 0.45,
) -> list[CompoundMatch]:
    """Cross-validate candidate compounds across 1H and 13C spectra when both are available."""
    by_name: dict[str, list[CompoundReference]] = defaultdict(list)
    for ref in library:
        by_name[ref.name].append(ref)

    results: list[CompoundMatch] = []
    for compound_name, refs in by_name.items():
        proton_ref = next((ref for ref in refs if ref.nucleus == "1H"), None)
        carbon_ref = next((ref for ref in refs if ref.nucleus == "13C"), None)
        proton_match = (
            _score_reference(proton_ref, proton_peaks or [], tolerance=0.02)
            if proton_spectrum is not None and proton_ref is not None
            else None
        )
        carbon_match = (
            _score_reference(carbon_ref, carbon_peaks or [], tolerance=0.5)
            if carbon_spectrum is not None and carbon_ref is not None
            else None
        )

        available = [m for m in (proton_match, carbon_match) if m is not None]
        if not available:
            continue
        combined_score = float(np.mean([m.score for m in available]))
        if proton_match and carbon_match:
            combined_score = min(1.0, combined_score + 0.1)
        if combined_score < min_score:
            continue

        primary = max(available, key=lambda item: item.score)
        results.append(
            CompoundMatch(
                compound_name=compound_name,
                nucleus="joint",
                score=combined_score,
                confidence=_score_to_confidence(combined_score),
                matched_peaks=primary.matched_peaks,
                missing_reference_peaks=primary.missing_reference_peaks,
                source=primary.source,
                metadata={
                    "proton_score": None if proton_match is None else proton_match.score,
                    "carbon_score": None if carbon_match is None else carbon_match.score,
                    "cross_validated": proton_match is not None and carbon_match is not None,
                },
            )
        )
    return sorted(results, key=lambda match: match.score, reverse=True)


def _score_reference(reference: CompoundReference | None, detected_peaks: list[Peak], tolerance: float) -> CompoundMatch:
    if reference is None:
        raise ValueError("Reference cannot be None for scoring.")

    matched_pairs: list[tuple[ReferencePeak, Peak]] = []
    missing: list[ReferencePeak] = []
    used_indices: set[int] = set()

    for ref_peak in reference.peaks:
        best_index, best_peak, best_delta = None, None, None
        for idx, peak in enumerate(detected_peaks):
            if idx in used_indices:
                continue
            delta = abs(peak.ppm - ref_peak.shift)
            if delta <= tolerance and (best_delta is None or delta < best_delta):
                best_index, best_peak, best_delta = idx, peak, delta
        if best_peak is None:
            missing.append(ref_peak)
            continue
        used_indices.add(best_index)
        matched_pairs.append((ref_peak, best_peak))

    presence_score = len(matched_pairs) / max(len(reference.peaks), 1)
    shift_score = _shift_score(matched_pairs, tolerance)
    multiplicity_score = _multiplicity_score(matched_pairs)
    intensity_score = _intensity_pattern_score(matched_pairs)
    total_score = (0.45 * presence_score) + (0.25 * shift_score) + (0.15 * multiplicity_score) + (0.15 * intensity_score)

    return CompoundMatch(
        compound_name=reference.name,
        nucleus=reference.nucleus,
        score=float(total_score),
        confidence=_score_to_confidence(total_score),
        matched_peaks=matched_pairs,
        missing_reference_peaks=missing,
        source=reference.source,
        metadata={
            "presence_score": presence_score,
            "shift_score": shift_score,
            "multiplicity_score": multiplicity_score,
            "intensity_score": intensity_score,
        },
    )


def _shift_score(matched_pairs: list[tuple[ReferencePeak, Peak]], tolerance: float) -> float:
    if not matched_pairs:
        return 0.0
    deltas = [abs(ref.shift - peak.ppm) for ref, peak in matched_pairs]
    scaled = [max(0.0, 1.0 - (delta / tolerance)) for delta in deltas]
    return float(np.mean(scaled))


def _multiplicity_score(matched_pairs: list[tuple[ReferencePeak, Peak]]) -> float:
    if not matched_pairs:
        return 0.0
    scores = []
    for ref, peak in matched_pairs:
        if ref.multiplicity is None:
            scores.append(1.0)
        else:
            scores.append(1.0 if ref.multiplicity.lower() == peak.multiplicity.lower() else 0.0)
    return float(np.mean(scores))


def _intensity_pattern_score(matched_pairs: list[tuple[ReferencePeak, Peak]]) -> float:
    if len(matched_pairs) <= 1:
        return 1.0 if matched_pairs else 0.0
    ref_values = np.array(
        [ref.relative_intensity for ref, _ in matched_pairs if ref.relative_intensity is not None],
        dtype=float,
    )
    peak_values = np.array(
        [peak.area for ref, peak in matched_pairs if ref.relative_intensity is not None],
        dtype=float,
    )
    if ref_values.size <= 1 or peak_values.size != ref_values.size:
        return 1.0
    ref_values = ref_values / np.max(ref_values)
    peak_values = peak_values / np.max(peak_values)
    error = np.mean(np.abs(ref_values - peak_values))
    return float(max(0.0, 1.0 - error))


def _default_shift_tolerance(nucleus: str) -> float:
    return 0.02 if nucleus == "1H" else 0.5


def _score_to_confidence(score: float) -> str:
    if score >= 0.85:
        return "high"
    if score >= 0.7:
        return "medium"
    if score >= 0.55:
        return "low"
    return "tentative"
