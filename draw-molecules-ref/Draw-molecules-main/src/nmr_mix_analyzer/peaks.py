"""Peak detection and simple multiplet characterization."""

from __future__ import annotations

import numpy as np
from scipy.signal import find_peaks, peak_widths

from .models import Peak, Spectrum


def detect_peaks(
    spectrum: Spectrum,
    snr_threshold: float = 5.0,
    min_distance_points: int = 3,
    prominence: float | None = None,
) -> list[Peak]:
    """Detect peaks and estimate integration bounds plus simple multiplicity."""
    y = spectrum.intensity.astype(float)
    noise = estimate_noise(y)
    prominence = prominence if prominence is not None else noise * snr_threshold
    indices, _ = find_peaks(y, prominence=prominence, distance=min_distance_points)
    if indices.size == 0:
        return []

    widths, _, left_ips, right_ips = peak_widths(y, indices, rel_height=0.5)
    peaks: list[Peak] = []

    for idx, left_ip, right_ip, width in zip(indices, left_ips, right_ips, widths):
        left_index = max(int(np.floor(left_ip)), 0)
        right_index = min(int(np.ceil(right_ip)), y.size - 1)
        area = float(np.trapezoid(y[left_index : right_index + 1], spectrum.ppm[left_index : right_index + 1]))
        local_indices = _neighbor_cluster(indices, idx, spectrum.ppm, max_delta_ppm=_cluster_tolerance(spectrum.nucleus))
        multiplicity, couplings = infer_multiplicity(spectrum.ppm[local_indices], y[local_indices], spectrum.nucleus)

        peaks.append(
            Peak(
                ppm=float(spectrum.ppm[idx]),
                intensity=float(y[idx]),
                left_ppm=float(spectrum.ppm[left_index]),
                right_ppm=float(spectrum.ppm[right_index]),
                area=abs(area),
                snr=float(y[idx] / max(noise, 1e-12)),
                width_hz=float(width),
                multiplicity=multiplicity,
                j_couplings_hz=couplings,
            )
        )
    return sorted(peaks, key=lambda peak: peak.ppm)


def estimate_noise(intensity: np.ndarray) -> float:
    """Robust noise estimate via median absolute deviation."""
    median = np.median(intensity)
    mad = np.median(np.abs(intensity - median))
    return float(max(1.4826 * mad, 1e-12))


def infer_multiplicity(ppm: np.ndarray, intensity: np.ndarray, nucleus: str) -> tuple[str, list[float]]:
    """Infer a coarse multiplicity label from nearby maxima."""
    count = ppm.size
    if nucleus != "1H":
        return "s", []
    if count <= 1:
        return "s", []
    if count == 2:
        return "d", [_mean_spacing_hz(ppm)]
    if count == 3:
        return "t", [_mean_spacing_hz(ppm)]
    if count == 4:
        return "q", [_mean_spacing_hz(ppm)]
    return "m", [_mean_spacing_hz(ppm)]


def _mean_spacing_hz(ppm: np.ndarray, spectrometer_mhz: float = 600.0) -> float:
    if ppm.size < 2:
        return 0.0
    diffs = np.diff(np.sort(ppm))
    return float(np.mean(np.abs(diffs)) * spectrometer_mhz)


def _neighbor_cluster(all_indices: np.ndarray, center_idx: int, ppm_scale: np.ndarray, max_delta_ppm: float) -> np.ndarray:
    center_ppm = ppm_scale[center_idx]
    mask = np.abs(ppm_scale[all_indices] - center_ppm) <= max_delta_ppm
    cluster = all_indices[mask]
    if cluster.size == 0:
        return np.array([center_idx])
    return cluster


def _cluster_tolerance(nucleus: str) -> float:
    return 0.03 if nucleus == "1H" else 0.3
