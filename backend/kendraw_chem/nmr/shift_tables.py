"""1H additive chemical shift tables with solvent corrections.

Base shifts and substituent increments derived from open-access NMR literature
and NMRShiftDB2 experimental data.

IMPORTANT: These values are NOT copied from copyrighted textbooks.
All data is derived from open-access published sources:
- NMRShiftDB2 (nmrshiftdb.nmr.uni-koeln.de) — experimental NMR database (CC-BY)
- SDBS (sdbs.db.aist.go.jp) — spectral database by AIST Japan (free access)
- Published open-access review papers on 1H NMR chemical shifts
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

# ---------------------------------------------------------------------------
# Solvent identifiers
# ---------------------------------------------------------------------------

SOLVENT_IDS = ("CDCl3", "DMSO-d6", "CD3OD", "acetone-d6", "C6D6", "D2O")

DEFAULT_SOLVENT = "CDCl3"

# ---------------------------------------------------------------------------
# Proton environment types  (12 core + 3 heteroatom-bound)
# ---------------------------------------------------------------------------

BASE_SHIFTS: dict[str, float] = {
    # Saturated C-H environments
    "methyl": 0.9,
    "methylene": 1.3,
    "methine": 1.5,
    # Adjacent-to-unsaturation
    "allylic": 1.7,
    "benzylic": 2.3,
    # Alpha to electronegative groups — CRITICAL: these encode the alpha effect
    "alpha_to_carbonyl": 2.1,
    "alpha_to_halogen": 3.5,
    "alpha_to_oxygen": 3.4,    # R-CH2-OR / R-CH2-OH  (was missing — MF-1 fix)
    "alpha_to_nitrogen": 2.6,  # R-CH2-NR2 / R-CH2-NH2 (was missing — MF-1 fix)
    # Unsaturated C-H
    "vinyl": 5.3,
    "aromatic": 7.26,
    "alkyne_terminal": 2.5,
    # Heteroatom-bound protons (solvent-dependent base values for CDCl3)
    "aldehyde": 9.7,
    "carboxylic_acid": 11.5,
    "amide_nh": 7.5,
    "amine_nh": 1.5,
    "hydroxyl_oh": 2.5,  # CDCl3 default; highly solvent-dependent
    "thiol_sh": 1.6,     # R-SH (was missing — SF-1 fix)
}

# ---------------------------------------------------------------------------
# Substituent increments (alpha-position effects on C-H)
# ---------------------------------------------------------------------------

SUBSTITUENT_INCREMENTS: dict[str, float] = {
    # Halogens (deshielding)
    "F": 0.25,
    "Cl": 0.55,
    "Br": 0.45,
    "I": 0.35,
    # Oxygen-containing (beta effect only — alpha effect in base env)
    "OH": 0.30,
    "OR": 0.35,
    # Nitrogen-containing (beta effect only — alpha effect in base env)
    "NH2": 0.20,
    "NR2": 0.25,
    "NO2": 0.95,
    "CN": 0.40,
    # Carbonyl-containing
    "C=O_ketone": 0.35,
    "COOH": 0.40,
    "COOR": 0.35,
    # Unsaturation
    "C=C": 0.15,
    "phenyl": 0.30,
    # Sulfur
    "SH": 0.20,
    "SR": 0.25,
    # Alkyl (small deshielding at alpha)
    "alkyl": 0.05,
}

# ---------------------------------------------------------------------------
# Aromatic substituent effects (Hammett-type corrections)
# Offsets applied to the 7.26 base aromatic shift based on ring position
# relative to substituent. Values derived from NMRShiftDB2 consensus.
# ---------------------------------------------------------------------------

AROMATIC_SUBSTITUENT_EFFECTS: dict[str, dict[str, float]] = {
    # format: { substituent_type: { "ortho": delta, "meta": delta, "para": delta } }
    # Electron-donating groups (shield, shift upfield = negative)
    "NH2":  {"ortho": -0.75, "meta": -0.25, "para": -0.65},
    "OH":   {"ortho": -0.56, "meta": -0.12, "para": -0.45},
    "OR":   {"ortho": -0.48, "meta": -0.09, "para": -0.44},
    "NR2":  {"ortho": -0.66, "meta": -0.18, "para": -0.67},
    "alkyl": {"ortho": -0.14, "meta": -0.06, "para": -0.17},
    "phenyl": {"ortho": 0.37, "meta": 0.20, "para": 0.10},
    # Electron-withdrawing groups (deshield, shift downfield = positive)
    "NO2":  {"ortho": 0.95, "meta": 0.26, "para": 0.38},
    "CN":   {"ortho": 0.36, "meta": 0.18, "para": 0.28},
    "COOH": {"ortho": 0.85, "meta": 0.18, "para": 0.27},
    "COOR": {"ortho": 0.71, "meta": 0.11, "para": 0.21},
    "C=O_ketone": {"ortho": 0.62, "meta": 0.14, "para": 0.21},
    "CHO":  {"ortho": 0.56, "meta": 0.22, "para": 0.29},
    # Halogens (mixed inductive/resonance)
    "F":    {"ortho": -0.26, "meta": 0.00, "para": -0.20},
    "Cl":   {"ortho": 0.03, "meta": -0.02, "para": -0.09},
    "Br":   {"ortho": 0.18, "meta": -0.08, "para": -0.04},
    "I":    {"ortho": 0.39, "meta": -0.21, "para": 0.00},
    # Sulfur
    "SH":   {"ortho": -0.08, "meta": -0.10, "para": -0.24},
    "SR":   {"ortho": -0.03, "meta": -0.08, "para": -0.18},
}

# ---------------------------------------------------------------------------
# Heterocyclic aromatic proton shifts
# Absolute shift values (not relative to benzene) for protons on common
# heteroaromatic rings. Keyed by (heteroatom_symbol, ring_size, position).
# position = "alpha" (adjacent to heteroatom), "beta" (2 bonds),
#            "gamma" (3 bonds, only in 6-membered rings)
# Derived from open-access NMR databases (NMRShiftDB2, SDBS).
# ---------------------------------------------------------------------------

HETEROCYCLIC_SHIFTS: dict[tuple[str, int, str], float] = {
    # Pyridine (6-membered, N)
    ("N", 6, "alpha"): 8.50,
    ("N", 6, "beta"):  7.20,
    ("N", 6, "gamma"): 7.60,
    # Pyrimidine (6-membered, 2x N) — use same as pyridine alpha for simplicity
    # Pyrrole (5-membered, N)
    ("N", 5, "alpha"): 6.70,
    ("N", 5, "beta"):  6.20,
    # Furan (5-membered, O)
    ("O", 5, "alpha"): 7.40,
    ("O", 5, "beta"):  6.30,
    # Thiophene (5-membered, S)
    ("S", 5, "alpha"): 7.20,
    ("S", 5, "beta"):  7.00,
}

# ---------------------------------------------------------------------------
# Solvent correction offsets
# Derived from Draw-molecules reference (open-access NMR literature consensus)
# Each solvent has per-environment ppm offsets relative to CDCl3
# ---------------------------------------------------------------------------

SolventProfile = dict[str, float]

SOLVENT_PROTON_OFFSETS: dict[str, SolventProfile] = {
    "CDCl3": {},  # Reference solvent — zero offsets
    "DMSO-d6": {
        "methyl": 0.04,
        "methylene": 0.04,
        "methine": 0.04,
        "benzylic": 0.08,
        "allylic": 0.06,
        "alpha_to_oxygen": 0.16,
        "alpha_to_nitrogen": 0.16,
        "alpha_to_halogen": 0.16,
        "alpha_to_carbonyl": 0.18,
        "vinyl": 0.10,
        "aromatic": 0.05,
        "aldehyde": 0.14,
        "hydroxyl_oh": 1.8,  # OH is sharp at ~4.3 ppm in DMSO
        "amine_nh": 0.7,
        "thiol_sh": 0.35,
        "alkyne_terminal": 0.07,
    },
    "CD3OD": {
        "methyl": 0.02,
        "methylene": 0.02,
        "methine": 0.02,
        "benzylic": 0.04,
        "allylic": 0.03,
        "alpha_to_oxygen": 0.11,
        "alpha_to_nitrogen": 0.11,
        "alpha_to_halogen": 0.11,
        "alpha_to_carbonyl": 0.09,
        "vinyl": 0.05,
        "aromatic": 0.01,
        "aldehyde": 0.04,
        "hydroxyl_oh": 0.0,  # OH exchanges with CD3OD — often invisible
        "amine_nh": 0.0,     # NH exchanges — often invisible
        "thiol_sh": 0.14,
        "alkyne_terminal": 0.02,
    },
    "acetone-d6": {
        "methyl": 0.03,
        "methylene": 0.03,
        "methine": 0.03,
        "benzylic": 0.05,
        "allylic": 0.04,
        "alpha_to_oxygen": 0.12,
        "alpha_to_nitrogen": 0.12,
        "alpha_to_halogen": 0.12,
        "alpha_to_carbonyl": 0.10,
        "vinyl": 0.05,
        "aromatic": 0.03,
        "aldehyde": 0.09,
        "hydroxyl_oh": 0.55,
        "amine_nh": 0.24,
        "thiol_sh": 0.16,
        "alkyne_terminal": 0.03,
    },
    "C6D6": {
        "methyl": -0.22,
        "methylene": -0.22,
        "methine": -0.22,
        "benzylic": -0.45,
        "allylic": -0.18,
        "alpha_to_oxygen": -0.15,
        "alpha_to_nitrogen": -0.15,
        "alpha_to_halogen": -0.15,
        "alpha_to_carbonyl": -0.08,
        "vinyl": -0.18,
        "aromatic": -0.34,
        "aldehyde": -0.17,
        "hydroxyl_oh": -0.28,
        "amine_nh": -0.22,
        "thiol_sh": -0.18,
        "alkyne_terminal": -0.14,
    },
    "D2O": {
        "methyl": 0.01,
        "methylene": 0.01,
        "methine": 0.01,
        "benzylic": 0.02,
        "allylic": 0.02,
        "alpha_to_oxygen": 0.08,
        "alpha_to_nitrogen": 0.08,
        "alpha_to_halogen": 0.08,
        "alpha_to_carbonyl": 0.06,
        "vinyl": 0.03,
        "aromatic": 0.00,
        "aldehyde": 0.02,
        "hydroxyl_oh": 0.0,  # OH exchanges with D2O — disappears
        "amine_nh": 0.0,     # NH exchanges — disappears
        "thiol_sh": 0.08,
        "alkyne_terminal": 0.02,
    },
}

# Solvent residual proton peaks (useful for spectrum display)
SOLVENT_RESIDUAL_PEAKS: dict[str, list[dict[str, float | str]]] = {
    "CDCl3": [{"shift": 7.26, "label": "CHCl3"}],
    "DMSO-d6": [{"shift": 2.50, "label": "DMSO"}],
    "CD3OD": [{"shift": 3.31, "label": "CHD2OD"}],
    "acetone-d6": [{"shift": 2.05, "label": "acetone"}],
    "C6D6": [{"shift": 7.16, "label": "C6D5H"}],
    "D2O": [{"shift": 4.79, "label": "HDO"}],
}

# ---------------------------------------------------------------------------
# J-coupling constants (Hz) — empirical values by bond path type
# Derived from open-access NMR literature
# ---------------------------------------------------------------------------

J_COUPLING_CONSTANTS: dict[str, float] = {
    # Vicinal (3-bond) couplings
    "vicinal_sp3_sp3": 7.0,        # H-C-C-H (both sp3), Karplus average
    "vicinal_sp3_sp2": 6.5,        # H-C-C=X
    "vicinal_sp2_sp2_trans": 16.0,  # H-C=C-H trans (alkene)
    "vicinal_sp2_sp2_cis": 10.0,   # H-C=C-H cis (alkene)
    "vicinal_aromatic_ortho": 7.8,  # Aromatic ortho coupling
    "vicinal_aldehyde": 2.8,        # H-C-C(=O)H
    "vicinal_alpha_hetero": 6.1,    # H-C-X-C-H (through heteroatom)
    # Geminal (2-bond) couplings
    "geminal_sp3": -12.0,           # H-C-H (sp3, usually not resolved)
    "geminal_sp2": 2.1,             # H-C=H (terminal alkene)
    # Long-range (4-bond) couplings
    "long_range_aromatic_meta": 1.8,  # Aromatic meta coupling
    "long_range_aromatic_para": 0.7,  # Aromatic para coupling
    "long_range_allylic": 1.6,       # Allylic coupling through pi system
    "long_range_benzylic": 1.5,      # Benzylic coupling
}

# ---------------------------------------------------------------------------
# Confidence reference counts
# ---------------------------------------------------------------------------

CONFIDENCE_REFERENCE_COUNTS: dict[str, int] = {
    "methyl": 50,
    "methylene": 45,
    "methine": 30,
    "allylic": 15,
    "benzylic": 20,
    "alpha_to_carbonyl": 25,
    "alpha_to_halogen": 18,
    "alpha_to_oxygen": 40,
    "alpha_to_nitrogen": 22,
    "vinyl": 22,
    "aromatic": 55,
    "alkyne_terminal": 10,
    "aldehyde": 30,
    "carboxylic_acid": 12,
    "amide_nh": 14,
    "amine_nh": 12,
    "hydroxyl_oh": 20,
    "thiol_sh": 8,
}
