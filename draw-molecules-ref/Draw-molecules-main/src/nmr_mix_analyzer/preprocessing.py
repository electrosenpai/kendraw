"""Preprocessing routines for time- and frequency-domain NMR spectra."""

from __future__ import annotations

import numpy as np
from scipy import sparse
from scipy.fft import fft, fftshift
from scipy.sparse.linalg import spsolve

from .models import Spectrum


def preprocess_spectrum(
    spectrum: Spectrum,
    baseline_method: str = "whittaker",
    baseline_degree: int = 3,
    whittaker_lambda: float = 1e5,
    whittaker_p: float = 0.001,
    solvent_regions: list[tuple[float, float]] | None = None,
    normalization: str | None = "total_area",
    reference_region: tuple[float, float] | None = None,
    reference_target_ppm: float | None = None,
) -> Spectrum:
    """Apply the standard preprocessing chain to a spectrum."""
    processed = spectrum.copy()
    if not processed.is_frequency_domain and processed.fid is not None:
        processed = fourier_transform(processed)

    processed = phase_correct(processed)
    processed = baseline_correct(
        processed,
        method=baseline_method,
        degree=baseline_degree,
        lam=whittaker_lambda,
        p=whittaker_p,
    )

    if solvent_regions:
        processed = remove_solvent_regions(processed, solvent_regions)
    if reference_region and reference_target_ppm is not None:
        processed = align_reference_peak(processed, reference_region, reference_target_ppm)
    if normalization:
        processed = normalize_spectrum(processed, method=normalization, reference_region=reference_region)
    return processed


def apodize(fid: np.ndarray, lb: float = 0.3) -> np.ndarray:
    """Apply simple exponential line broadening."""
    t = np.arange(fid.size, dtype=float)
    window = np.exp(-lb * t / max(fid.size, 1))
    return fid * window


def zero_fill(fid: np.ndarray, factor: int = 2) -> np.ndarray:
    """Zero fill a time-domain FID by an integer factor."""
    if factor <= 1:
        return fid
    out = np.zeros(fid.size * factor, dtype=fid.dtype)
    out[: fid.size] = fid
    return out


def fourier_transform(spectrum: Spectrum, lb: float = 0.3, zero_fill_factor: int = 2) -> Spectrum:
    """Convert a raw FID into a frequency-domain spectrum."""
    if spectrum.fid is None:
        raise ValueError("Spectrum does not contain FID data.")
    fid = zero_fill(apodize(np.asarray(spectrum.fid), lb=lb), factor=zero_fill_factor)
    transformed = fftshift(fft(fid))
    intensity = np.real(transformed)

    ppm = spectrum.ppm
    if ppm.size != intensity.size:
        ppm = np.linspace(float(np.max(spectrum.ppm)), float(np.min(spectrum.ppm)), num=intensity.size)

    return Spectrum(
        ppm=np.asarray(ppm, dtype=float),
        intensity=np.asarray(intensity, dtype=float),
        nucleus=spectrum.nucleus,
        sample_id=spectrum.sample_id,
        metadata={**spectrum.metadata, "processed_from_fid": True},
        is_frequency_domain=True,
    )


def phase_correct(spectrum: Spectrum, p0: float | None = None, p1: float | None = None) -> Spectrum:
    """Apply a basic zero-/first-order phase correction."""
    if spectrum.fid is not None and not spectrum.is_frequency_domain:
        return spectrum

    signal = spectrum.intensity.astype(float)
    x = np.linspace(-0.5, 0.5, signal.size)
    p0 = 0.0 if p0 is None else p0
    p1 = 0.0 if p1 is None else p1
    phased = signal * np.cos(np.deg2rad(p0 + p1 * x))
    out = spectrum.copy()
    out.intensity = phased
    out.metadata["phase_correction"] = {"p0": p0, "p1": p1}
    return out


def baseline_correct(
    spectrum: Spectrum,
    method: str = "whittaker",
    degree: int = 3,
    lam: float = 1e5,
    p: float = 0.001,
    n_iter: int = 10,
) -> Spectrum:
    """Remove baseline using polynomial fitting or asymmetric Whittaker smoothing."""
    y = spectrum.intensity.astype(float)
    x = spectrum.ppm.astype(float)
    method = method.lower()
    if method == "polynomial":
        coeffs = np.polyfit(x, y, deg=degree)
        baseline = np.polyval(coeffs, x)
    elif method == "whittaker":
        baseline = _asymmetric_whittaker(y, lam=lam, p=p, n_iter=n_iter)
    else:
        raise ValueError(f"Unsupported baseline method: {method}")

    out = spectrum.copy()
    out.intensity = y - baseline
    out.metadata["baseline_correction"] = {"method": method}
    return out


def remove_solvent_regions(spectrum: Spectrum, regions: list[tuple[float, float]]) -> Spectrum:
    """Suppress known solvent regions by zeroing them."""
    out = spectrum.copy()
    mask = np.zeros(out.ppm.shape, dtype=bool)
    for low, high in regions:
        lo, hi = sorted((low, high))
        mask |= (out.ppm >= lo) & (out.ppm <= hi)
    out.intensity[mask] = 0.0
    out.metadata["solvent_regions"] = regions
    return out


def align_reference_peak(spectrum: Spectrum, reference_region: tuple[float, float], target_ppm: float) -> Spectrum:
    """Shift the ppm axis so the strongest peak in a region lands on the target ppm."""
    lo, hi = sorted(reference_region)
    mask = (spectrum.ppm >= lo) & (spectrum.ppm <= hi)
    if not np.any(mask):
        return spectrum.copy()
    ppm_region = spectrum.ppm[mask]
    intensity_region = spectrum.intensity[mask]
    observed_ppm = float(ppm_region[np.argmax(intensity_region)])
    delta = target_ppm - observed_ppm
    out = spectrum.copy()
    out.ppm = out.ppm + delta
    out.metadata["reference_alignment"] = {"observed_ppm": observed_ppm, "target_ppm": target_ppm}
    return out


def normalize_spectrum(
    spectrum: Spectrum,
    method: str = "total_area",
    reference_region: tuple[float, float] | None = None,
    reference_intensity: float = 1.0,
    pqn_reference: np.ndarray | None = None,
) -> Spectrum:
    """Normalize a spectrum using total area, PQN, or a reference peak."""
    method = method.lower()
    y = spectrum.intensity.astype(float)
    out = spectrum.copy()
    if method == "total_area":
        denom = np.trapezoid(np.abs(y), spectrum.ppm)
    elif method == "reference_peak":
        if reference_region is None:
            raise ValueError("reference_region is required for reference_peak normalization.")
        lo, hi = sorted(reference_region)
        mask = (spectrum.ppm >= lo) & (spectrum.ppm <= hi)
        denom = np.max(np.abs(y[mask])) / max(reference_intensity, 1e-12)
    elif method == "pqn":
        ref = np.asarray(pqn_reference if pqn_reference is not None else np.median(np.abs(y)))
        quotients = np.abs(y) / np.maximum(ref, 1e-12)
        denom = np.median(quotients)
    else:
        raise ValueError(f"Unsupported normalization method: {method}")

    denom = float(denom) if np.isscalar(denom) else float(np.median(denom))
    if abs(denom) < 1e-12:
        return out
    out.intensity = y / denom
    out.metadata["normalization"] = {"method": method, "denominator": denom}
    return out


def _asymmetric_whittaker(y: np.ndarray, lam: float, p: float, n_iter: int) -> np.ndarray:
    """Asymmetric least-squares baseline estimation."""
    length = y.size
    d = sparse.diags([1.0, -2.0, 1.0], [0, -1, -2], shape=(length, length - 2))
    w = np.ones(length)
    for _ in range(n_iter):
        w_mat = sparse.spdiags(w, 0, length, length)
        system = (w_mat + lam * d.dot(d.T)).tocsc()
        z = spsolve(system, w * y)
        w = p * (y > z) + (1 - p) * (y < z)
    return np.asarray(z)
