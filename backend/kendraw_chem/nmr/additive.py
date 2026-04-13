"""Additive increment 1H NMR chemical shift prediction.

Classifies each hydrogen atom's chemical environment, looks up base shifts
from shift_tables.BASE_SHIFTS, sums applicable substituent increments from
shift_tables.SUBSTITUENT_INCREMENTS, and scores confidence from
shift_tables.CONFIDENCE_REFERENCE_COUNTS.

Pure function: same mol always produces identical output.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from kendraw_chem.nmr.models import NmrPeak
from kendraw_chem.nmr.shift_tables import (
    BASE_SHIFTS,
    CONFIDENCE_REFERENCE_COUNTS,
    SUBSTITUENT_INCREMENTS,
)

if TYPE_CHECKING:
    from rdkit.Chem import Mol  # type: ignore[import-not-found]

# Mapping from RDKit atomic number to substituent key
_SUBSTITUENT_MAP: dict[int, str] = {
    9: "F",
    17: "Cl",
    35: "Br",
    53: "I",
}

# Special base environments where the base shift already encodes the
# neighbor's effect. When one of these is returned, the triggering
# neighbor is excluded from substituent collection to avoid double-counting.
_SPECIAL_ENVS = frozenset({
    "alpha_to_halogen",
    "alpha_to_carbonyl",
    "benzylic",
    "allylic",
})


def _classify_h_environment(
    mol: Mol,
    h_idx: int,
    parent_idx: int,
) -> tuple[str, list[str]]:
    """Classify a hydrogen atom's chemical environment.

    Returns (base_environment_key, list_of_substituent_keys).
    """
    from rdkit import Chem  # type: ignore[import-not-found]

    parent = mol.GetAtomWithIdx(parent_idx)
    parent_num = parent.GetAtomicNum()
    parent_hyb = parent.GetHybridization()

    # Heteroatom-bound protons
    if parent_num == 7:  # Nitrogen
        # Check if amide (N bonded to C=O)
        for nbr in parent.GetNeighbors():
            if nbr.GetAtomicNum() == 6:
                for nbr2 in nbr.GetNeighbors():
                    if nbr2.GetAtomicNum() == 8:
                        bond = mol.GetBondBetweenAtoms(
                            nbr.GetIdx(), nbr2.GetIdx()
                        )
                        if (
                            bond is not None
                            and bond.GetBondTypeAsDouble() == 2.0
                        ):
                            return "amide_nh", []
        return "amine_nh", []

    if parent_num == 8:  # Oxygen
        # Check if carboxylic acid (O-C=O)
        for nbr in parent.GetNeighbors():
            if nbr.GetAtomicNum() == 6:
                for nbr2 in nbr.GetNeighbors():
                    if (
                        nbr2.GetAtomicNum() == 8
                        and nbr2.GetIdx() != parent_idx
                        and mol.GetBondBetweenAtoms(
                            nbr.GetIdx(), nbr2.GetIdx()
                        ).GetBondTypeAsDouble()
                        == 2.0
                    ):
                        return "carboxylic_acid", []
        return "hydroxyl_oh", []

    # Carbon-bound protons
    if parent_num != 6:
        # Fallback for other heteroatoms
        return "methyl", []

    # Determine carbon hybridization-based environment
    hyb = Chem.HybridizationType
    substituents: list[str] = []
    exclude_idx: int | None = None

    if parent_hyb == hyb.SP:
        base_env = "alkyne_terminal"
    elif parent_hyb == hyb.SP2:
        if parent.GetIsAromatic():
            base_env = "aromatic"
        else:
            # Check for aldehyde: C(=O)H
            is_aldehyde = False
            for nbr in parent.GetNeighbors():
                if nbr.GetAtomicNum() == 8:
                    bond = mol.GetBondBetweenAtoms(parent_idx, nbr.GetIdx())
                    if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                        is_aldehyde = True
                        break
            base_env = "aldehyde" if is_aldehyde else "vinyl"
    else:
        # SP3 carbon — classify by H count and neighbors
        # Count actual H atom neighbors (GetTotalNumHs returns 0 after AddHs
        # because Hs are now separate atoms, not implicit/explicit counts).
        h_count = sum(1 for n in parent.GetNeighbors() if n.GetAtomicNum() == 1)
        base_env, exclude_idx = _classify_sp3_carbon(mol, parent_idx, h_count)

    # Collect alpha substituents, excluding the neighbor that triggered
    # a special environment classification (avoids double-counting)
    if parent_num == 6:
        substituents = _collect_substituents(mol, parent_idx, exclude_idx)

    return base_env, substituents


def _classify_sp3_carbon(
    mol: Mol, c_idx: int, h_count: int,
) -> tuple[str, int | None]:
    """Classify an sp3 carbon's H environment based on neighbors.

    Returns (env_key, triggering_neighbor_idx). The neighbor index is set
    when a special environment is detected, so the caller can exclude that
    neighbor from substituent collection.
    """
    from rdkit import Chem

    atom = mol.GetAtomWithIdx(c_idx)
    hyb = Chem.HybridizationType

    # Check for special alpha environments first
    for nbr in atom.GetNeighbors():
        nbr_num = nbr.GetAtomicNum()
        # Alpha to halogen
        if nbr_num in (9, 17, 35, 53):
            return "alpha_to_halogen", nbr.GetIdx()
        # Alpha to carbonyl (C=O neighbor)
        if nbr_num == 6 and nbr.GetHybridization() == hyb.SP2:
            for nbr2 in nbr.GetNeighbors():
                if nbr2.GetAtomicNum() == 8:
                    bond = mol.GetBondBetweenAtoms(nbr.GetIdx(), nbr2.GetIdx())
                    if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                        return "alpha_to_carbonyl", nbr.GetIdx()
        # Benzylic (bonded to aromatic carbon)
        if nbr_num == 6 and nbr.GetIsAromatic():
            return "benzylic", nbr.GetIdx()
        # Allylic (bonded to sp2 carbon that's not aromatic)
        if (
            nbr_num == 6
            and nbr.GetHybridization() == hyb.SP2
            and not nbr.GetIsAromatic()
        ):
            return "allylic", nbr.GetIdx()

    # Plain saturated C-H — no special neighbor to exclude
    if h_count >= 3:
        return "methyl", None
    if h_count == 2:
        return "methylene", None
    return "methine", None


def _collect_substituents(
    mol: Mol,
    c_idx: int,
    exclude_idx: int | None = None,
) -> list[str]:
    """Collect substituent keys for alpha-position effects on a carbon.

    Args:
        mol: RDKit molecule.
        c_idx: Index of the carbon bearing the hydrogen.
        exclude_idx: Optional neighbor atom index to skip (the neighbor whose
            effect is already encoded in the base environment shift).
    """
    atom = mol.GetAtomWithIdx(c_idx)
    parent_is_aromatic = atom.GetIsAromatic()
    subs: list[str] = []

    for nbr in atom.GetNeighbors():
        if exclude_idx is not None and nbr.GetIdx() == exclude_idx:
            continue

        nbr_num = nbr.GetAtomicNum()

        # Direct halogen
        if nbr_num in _SUBSTITUENT_MAP:
            subs.append(_SUBSTITUENT_MAP[nbr_num])
            continue

        # Oxygen-based substituents
        if nbr_num == 8:
            bond = mol.GetBondBetweenAtoms(c_idx, nbr.GetIdx())
            if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                # C=O — check for COOH vs COOR vs ketone
                has_oh = False
                has_or = False
                for nbr2 in atom.GetNeighbors():
                    if nbr2.GetAtomicNum() == 8 and nbr2.GetIdx() != nbr.GetIdx():
                        if nbr2.GetTotalNumHs() > 0:
                            has_oh = True
                        else:
                            has_or = True
                        break
                if has_oh:
                    subs.append("COOH")
                elif has_or:
                    subs.append("COOR")
                else:
                    subs.append("C=O_ketone")
            else:
                # Single-bond O — OH or OR
                if nbr.GetTotalNumHs() > 0:
                    subs.append("OH")
                else:
                    subs.append("OR")
            continue

        # Nitrogen-based substituents
        if nbr_num == 7:
            # Check for NO2 (two oxygens on N)
            o_count = sum(
                1 for n2 in nbr.GetNeighbors() if n2.GetAtomicNum() == 8
            )
            if o_count >= 2:
                subs.append("NO2")
            elif nbr.GetTotalNumHs() >= 2:
                subs.append("NH2")
            else:
                subs.append("NR2")
            continue

        # Carbon-based substituents
        if nbr_num == 6:
            if nbr.GetIsAromatic():
                # Skip ring partners (both atoms aromatic = same ring);
                # only count as "phenyl" when parent is non-aromatic (e.g. benzylic CH2)
                if not parent_is_aromatic:
                    subs.append("phenyl")
            else:
                bond = mol.GetBondBetweenAtoms(c_idx, nbr.GetIdx())
                if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                    subs.append("C=C")
                # Check for CN (nitrile): C#N
                for nbr2 in nbr.GetNeighbors():
                    if nbr2.GetAtomicNum() == 7:
                        cn_bond = mol.GetBondBetweenAtoms(
                            nbr.GetIdx(), nbr2.GetIdx()
                        )
                        if (
                            cn_bond is not None
                            and cn_bond.GetBondTypeAsDouble() == 3.0
                        ):
                            subs.append("CN")
            continue

    return subs


def _confidence_from_counts(env_key: str) -> int:
    """Map reference count to confidence tier (1-3)."""
    count = CONFIDENCE_REFERENCE_COUNTS.get(env_key, 0)
    if count >= 10:
        return 3
    if count >= 3:
        return 2
    return 1


def predict_additive(mol: Mol) -> list[NmrPeak]:
    """Predict 1H NMR chemical shifts using additive increment method.

    Pure function: same mol always produces identical output.
    Peaks are sorted by shift_ppm descending, then by first atom_index ascending.
    Chemically equivalent protons are grouped into single peaks.
    """
    from rdkit import Chem

    # Add explicit Hs for enumeration
    mol_h = Chem.AddHs(mol)

    # Collect raw predictions per hydrogen
    raw_predictions: list[tuple[int, float, str, int]] = []

    for atom in mol_h.GetAtoms():
        if atom.GetAtomicNum() != 1:
            continue

        h_idx = atom.GetIdx()
        # Find the parent (heavy atom bonded to this H)
        neighbors = atom.GetNeighbors()
        if not neighbors:
            continue
        parent_idx = neighbors[0].GetIdx()

        env_key, substituent_keys = _classify_h_environment(mol_h, h_idx, parent_idx)

        # Base shift lookup
        base_shift = BASE_SHIFTS.get(env_key, BASE_SHIFTS["methyl"])

        # Sum substituent increments
        increment = 0.0
        for sub_key in substituent_keys:
            increment += SUBSTITUENT_INCREMENTS.get(sub_key, 0.0)

        shift_ppm = round(base_shift + increment, 2)
        confidence = _confidence_from_counts(env_key)

        raw_predictions.append((h_idx, shift_ppm, env_key, confidence))

    # Group equivalent protons (same shift and same environment)
    groups: dict[tuple[float, str], list[int]] = {}
    confidence_map: dict[tuple[float, str], int] = {}
    for h_idx, shift, env, conf in raw_predictions:
        key = (shift, env)
        if key not in groups:
            groups[key] = []
            confidence_map[key] = conf
        groups[key].append(h_idx)

    # Build peaks
    peaks: list[NmrPeak] = []
    for (shift, _env), indices in groups.items():
        sorted_indices = sorted(indices)
        peaks.append(
            NmrPeak(
                atom_index=sorted_indices[0],
                atom_indices=sorted_indices,
                shift_ppm=shift,
                confidence=confidence_map[(shift, _env)],
                method="additive",
            )
        )

    # Sort: shift_ppm descending, then first atom_index ascending for stability
    peaks.sort(key=lambda p: (-p.shift_ppm, p.atom_index))

    return peaks
