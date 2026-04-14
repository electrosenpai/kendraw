"""Additive increment 13C NMR chemical shift prediction.

Classifies each carbon atom's chemical environment, looks up base shifts,
sums applicable substituent increments, and applies corrections.

Pure function: same mol + solvent always produces identical output.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from kendraw_chem.nmr.models import NmrPeak

if TYPE_CHECKING:
    from rdkit.Chem import Mol

# ---------------------------------------------------------------------------
# 13C base shifts by carbon environment
# Derived from open-access NMR databases (NMRShiftDB2, SDBS).
# ---------------------------------------------------------------------------

BASE_SHIFTS_13C: dict[str, float] = {
    "CH3_alkyl": 15.0,
    "CH2_alkyl": 25.0,
    "CH_alkyl": 35.0,
    "C_quaternary": 40.0,
    "CH3_alpha_O": 55.0,
    "CH2_alpha_O": 65.0,
    "CH_alpha_O": 70.0,
    "C_alpha_O": 75.0,
    "CH3_alpha_N": 35.0,
    "CH2_alpha_N": 45.0,
    "CH_alpha_N": 55.0,
    "CH3_alpha_halogen": 25.0,
    "CH2_alpha_halogen": 40.0,
    "CH_alpha_halogen": 55.0,
    "C_alpha_halogen": 65.0,
    "C_aromatic_CH": 128.0,
    "C_aromatic_C": 137.0,
    "C_vinyl": 125.0,
    "C_alkyne": 75.0,
    "C_ketone": 205.0,
    "C_aldehyde": 200.0,
    "C_carboxylic_acid": 175.0,
    "C_ester": 170.0,
    "C_amide": 170.0,
    "CH3_alpha_carbonyl": 30.0,
    "CH2_alpha_carbonyl": 38.0,
    "CH_alpha_carbonyl": 42.0,
    "CH3_benzylic": 21.0,
    "CH2_benzylic": 35.0,
}

# Substituent corrections for 13C (alpha effects)
SUBSTITUENT_CORRECTIONS_13C: dict[str, float] = {
    "OH": 5.0,
    "OR": 5.0,
    "NH2": 3.0,
    "NR2": 3.0,
    "F": -5.0,
    "Cl": 5.0,
    "Br": -5.0,
    "I": -15.0,
    "C=O": 3.0,
    "phenyl": 5.0,
}


def _classify_carbon_13c(
    mol: Mol,
    c_idx: int,
) -> tuple[str, int, str]:
    """Classify a carbon for 13C prediction.

    Returns (env_key, h_count, dept_class).
    dept_class is one of "CH3", "CH2", "CH", "C".
    """
    from rdkit import Chem

    atom = mol.GetAtomWithIdx(c_idx)
    hyb = Chem.HybridizationType

    # Count directly bonded H atoms
    h_count = sum(1 for n in atom.GetNeighbors() if n.GetAtomicNum() == 1)
    dept_map = {0: "C", 1: "CH", 2: "CH2", 3: "CH3"}
    dept_class = dept_map.get(h_count, "CH3" if h_count > 3 else "C")

    # Check for C=O
    for nbr in atom.GetNeighbors():
        if nbr.GetAtomicNum() == 8:
            bond = mol.GetBondBetweenAtoms(c_idx, nbr.GetIdx())
            if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                # This is a carbonyl carbon
                # Check for acid/ester/amide
                for nbr2 in atom.GetNeighbors():
                    if nbr2.GetIdx() == nbr.GetIdx():
                        continue
                    if nbr2.GetAtomicNum() == 8:
                        if nbr2.GetTotalNumHs() > 0:
                            return "C_carboxylic_acid", h_count, dept_class
                        return "C_ester", h_count, dept_class
                    if nbr2.GetAtomicNum() == 7:
                        return "C_amide", h_count, dept_class
                # Check for aldehyde vs ketone
                if h_count >= 1:
                    return "C_aldehyde", h_count, dept_class
                return "C_ketone", h_count, dept_class

    # Aromatic
    if atom.GetIsAromatic():
        if h_count > 0:
            return "C_aromatic_CH", h_count, dept_class
        return "C_aromatic_C", h_count, dept_class

    # sp2 (vinyl)
    if atom.GetHybridization() == hyb.SP2:
        return "C_vinyl", h_count, dept_class

    # sp (alkyne)
    if atom.GetHybridization() == hyb.SP:
        return "C_alkyne", h_count, dept_class

    # sp3 — check neighbors for alpha effects
    h_prefix = dept_class  # "CH3", "CH2", "CH", or "C"

    for nbr in atom.GetNeighbors():
        if nbr.GetAtomicNum() == 1:
            continue
        nbr_num = nbr.GetAtomicNum()
        if nbr_num == 8:
            key = f"{h_prefix}_alpha_O"
            if key in BASE_SHIFTS_13C:
                return key, h_count, dept_class
        if nbr_num == 7:
            key = f"{h_prefix}_alpha_N"
            if key in BASE_SHIFTS_13C:
                return key, h_count, dept_class
        if nbr_num in (9, 17, 35, 53):
            key = f"{h_prefix}_alpha_halogen"
            if key in BASE_SHIFTS_13C:
                return key, h_count, dept_class
        if nbr_num == 6:
            # Alpha to carbonyl
            for nbr2 in nbr.GetNeighbors():
                if nbr2.GetAtomicNum() == 8:
                    bond = mol.GetBondBetweenAtoms(nbr.GetIdx(), nbr2.GetIdx())
                    if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                        key = f"{h_prefix}_alpha_carbonyl"
                        if key in BASE_SHIFTS_13C:
                            return key, h_count, dept_class
            # Benzylic
            if nbr.GetIsAromatic():
                key = f"{h_prefix}_benzylic"
                if key in BASE_SHIFTS_13C:
                    return key, h_count, dept_class

    # Default alkyl
    key = f"{h_prefix}_alkyl"
    if key in BASE_SHIFTS_13C:
        return key, h_count, dept_class
    return "CH3_alkyl", h_count, dept_class


def _confidence_13c(env_key: str) -> int:
    """Confidence scoring for 13C predictions."""
    high_conf = {
        "CH3_alkyl",
        "CH2_alkyl",
        "CH_alkyl",
        "C_aromatic_CH",
        "C_aromatic_C",
        "C_ketone",
        "C_aldehyde",
        "C_carboxylic_acid",
        "CH3_benzylic",
    }
    medium_conf = {
        "C_vinyl",
        "C_alkyne",
        "C_ester",
        "C_amide",
        "CH3_alpha_O",
        "CH2_alpha_O",
        "CH3_alpha_carbonyl",
        "CH2_alpha_carbonyl",
        "C_quaternary",
        "CH2_benzylic",
    }
    if env_key in high_conf:
        return 3
    if env_key in medium_conf:
        return 2
    return 1


def predict_additive_13c(
    mol: Mol,
    solvent: str = "CDCl3",
) -> list[NmrPeak]:
    """Predict 13C NMR chemical shifts using additive increment method.

    In proton-decoupled 13C, all peaks are singlets (no multiplicities).
    Integrals are not quantitative in standard 13C.
    """
    from rdkit import Chem

    mol_h = Chem.AddHs(mol)

    raw_predictions: list[tuple[int, float, str, int, str, str]] = []

    for atom in mol_h.GetAtoms():  # type: ignore[no-untyped-call]
        if atom.GetAtomicNum() != 6:
            continue

        c_idx = atom.GetIdx()
        env_key, _h_count, dept_class = _classify_carbon_13c(mol_h, c_idx)
        base_shift = BASE_SHIFTS_13C.get(env_key, 25.0)

        confidence = _confidence_13c(env_key)
        method = "additive-13C"

        raw_predictions.append(
            (c_idx, round(base_shift, 2), env_key, confidence, method, dept_class)
        )

    # Group equivalent carbons (same shift and same environment)
    groups: dict[tuple[float, str], list[int]] = {}
    conf_map: dict[tuple[float, str], int] = {}
    method_map: dict[tuple[float, str], str] = {}
    dept_map: dict[tuple[float, str], str] = {}

    for c_idx, shift, env, conf, meth, dept in raw_predictions:
        key = (shift, env)
        if key not in groups:
            groups[key] = []
            conf_map[key] = conf
            method_map[key] = meth
            dept_map[key] = dept
        groups[key].append(c_idx)

    # Build peaks
    peaks: list[NmrPeak] = []
    for (shift, env), indices in groups.items():
        sorted_indices = sorted(indices)
        peaks.append(
            NmrPeak(
                atom_index=sorted_indices[0],
                atom_indices=sorted_indices,
                parent_indices=sorted_indices,
                shift_ppm=shift,
                integral=len(sorted_indices),
                multiplicity="s",  # All singlets in decoupled 13C
                coupling_hz=[],
                environment=env,
                confidence=conf_map[(shift, env)],
                method=method_map[(shift, env)],
                proton_group_id=0,  # Will be assigned after sort
                dept_class=dept_map[(shift, env)],
            )
        )

    # Sort: shift_ppm descending
    peaks.sort(key=lambda p: (-p.shift_ppm, p.atom_index))

    # Assign group IDs
    for gid, peak in enumerate(peaks, start=1):
        peak.proton_group_id = gid

    return peaks
