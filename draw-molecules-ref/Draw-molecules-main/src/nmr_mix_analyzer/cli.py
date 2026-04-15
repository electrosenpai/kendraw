"""Command line interface for the NMR mixture analyzer."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from .identification import identify_compounds
from .io import load_reference_library, load_spectrum
from .peaks import detect_peaks
from .preprocessing import preprocess_spectrum


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Analyse 1H/13C NMR spectra from metabolomic mixtures.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze = subparsers.add_parser("analyze", help="Run preprocessing, peak detection, and library matching.")
    analyze.add_argument("--input", required=True, help="Spectrum input file or Bruker directory.")
    analyze.add_argument("--reference", required=True, help="Reference library JSON or CSV.")
    analyze.add_argument("--nucleus", default="1H", choices=["1H", "13C"], help="Nucleus for the input spectrum.")
    analyze.add_argument("--sample-id", default=None, help="Optional sample identifier.")
    analyze.add_argument("--baseline-method", default="whittaker", choices=["whittaker", "polynomial"])
    analyze.add_argument("--snr-threshold", type=float, default=5.0)
    analyze.add_argument("--normalization", default="total_area", choices=["total_area", "pqn", "reference_peak", "none"])
    analyze.add_argument("--solvent-region", action="append", default=[], help="Solvent region as low:high ppm, repeatable.")
    analyze.add_argument("--reference-region", default=None, help="Reference peak region as low:high ppm.")
    analyze.add_argument("--reference-target-ppm", type=float, default=None)
    analyze.add_argument("--output", default=None, help="Optional output CSV file for compound matches.")
    analyze.add_argument("--json", action="store_true", help="Emit JSON to stdout.")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "analyze":
        normalization = None if args.normalization == "none" else args.normalization
        reference_region = _parse_region(args.reference_region) if args.reference_region else None
        solvent_regions = [_parse_region(region) for region in args.solvent_region]

        spectrum = load_spectrum(args.input, nucleus=args.nucleus, sample_id=args.sample_id)
        spectrum = preprocess_spectrum(
            spectrum,
            baseline_method=args.baseline_method,
            solvent_regions=solvent_regions or None,
            normalization=normalization,
            reference_region=reference_region,
            reference_target_ppm=args.reference_target_ppm,
        )
        peaks = detect_peaks(spectrum, snr_threshold=args.snr_threshold)
        library = load_reference_library(args.reference)
        matches = identify_compounds(spectrum, peaks, library)

        table = pd.DataFrame(
            [
                {
                    "compound": match.compound_name,
                    "nucleus": match.nucleus,
                    "score": round(match.score, 4),
                    "confidence": match.confidence,
                    "matched_peaks": len(match.matched_peaks),
                    "missing_peaks": len(match.missing_reference_peaks),
                    "source": match.source,
                }
                for match in matches
            ]
        )

        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            table.to_csv(args.output, index=False)

        if args.json:
            print(json.dumps(table.to_dict(orient="records"), indent=2))
        elif table.empty:
            print("No candidate compounds passed the minimum score threshold.")
        else:
            print(table.to_string(index=False))


def _parse_region(value: str) -> tuple[float, float]:
    low, high = value.split(":")
    return float(low), float(high)


if __name__ == "__main__":
    main()
