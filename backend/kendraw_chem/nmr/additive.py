"""Additive increment 1H NMR chemical shift prediction.

Classifies each hydrogen atom's chemical environment, looks up base shifts,
sums applicable substituent increments, computes multiplicity from topology,
and applies solvent corrections.

Pure function: same mol + solvent always produces identical output.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from kendraw_chem.nmr.models import NmrPeak
from kendraw_chem.nmr.shift_tables import (
    AROMATIC_SUBSTITUENT_EFFECTS,
    BASE_SHIFTS,
    CONFIDENCE_REFERENCE_COUNTS,
    DEFAULT_SOLVENT,
    J_COUPLING_CONSTANTS,
    SOLVENT_PROTON_OFFSETS,
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
    "alpha_to_oxygen",
    "alpha_to_nitrogen",
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
        for nbr in parent.GetNeighbors():
            if nbr.GetAtomicNum() == 6:
                for nbr2 in nbr.GetNeighbors():
                    if (
                        nbr2.GetAtomicNum() == 8
                        and nbr2.GetIdx() != parent_idx
                    ):
                        bond = mol.GetBondBetweenAtoms(
                            nbr.GetIdx(), nbr2.GetIdx()
                        )
                        if (
                            bond is not None
                            and bond.GetBondTypeAsDouble() == 2.0
                        ):
                            return "carboxylic_acid", []
        return "hydroxyl_oh", []

    if parent_num == 16:  # Sulfur
        return "thiol_sh", []

    # Carbon-bound protons
    if parent_num != 6:
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
            is_aldehyde = False
            for nbr in parent.GetNeighbors():
                if nbr.GetAtomicNum() == 8:
                    bond = mol.GetBondBetweenAtoms(parent_idx, nbr.GetIdx())
                    if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                        is_aldehyde = True
                        break
            base_env = "aldehyde" if is_aldehyde else "vinyl"
    else:
        # SP3 carbon
        h_count = sum(
            1 for n in parent.GetNeighbors() if n.GetAtomicNum() == 1
        )
        base_env, exclude_idx = _classify_sp3_carbon(mol, parent_idx, h_count)

    # Collect alpha substituents
    if parent_num == 6:
        substituents = _collect_substituents(mol, parent_idx, exclude_idx)

    return base_env, substituents


def _classify_sp3_carbon(
    mol: Mol, c_idx: int, h_count: int,
) -> tuple[str, int | None]:
    """Classify an sp3 carbon's H environment based on neighbors."""
    from rdkit import Chem

    atom = mol.GetAtomWithIdx(c_idx)
    hyb = Chem.HybridizationType

    for nbr in atom.GetNeighbors():
        nbr_num = nbr.GetAtomicNum()
        # Alpha to halogen
        if nbr_num in (9, 17, 35, 53):
            return "alpha_to_halogen", nbr.GetIdx()
        # Alpha to oxygen (MF-1 fix: dedicated environment)
        if nbr_num == 8:
            return "alpha_to_oxygen", nbr.GetIdx()
        # Alpha to nitrogen (MF-1 fix: dedicated environment)
        if nbr_num == 7:
            return "alpha_to_nitrogen", nbr.GetIdx()
        # Alpha to sulfur — similar shift to alpha-oxygen
        if nbr_num == 16:
            return "alpha_to_oxygen", nbr.GetIdx()
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
    """Collect substituent keys for alpha-position effects on a carbon."""
    atom = mol.GetAtomWithIdx(c_idx)
    parent_is_aromatic = atom.GetIsAromatic()
    subs: list[str] = []

    for nbr in atom.GetNeighbors():
        if exclude_idx is not None and nbr.GetIdx() == exclude_idx:
            continue

        nbr_num = nbr.GetAtomicNum()

        if nbr_num == 1:
            continue

        # Direct halogen
        if nbr_num in _SUBSTITUENT_MAP:
            subs.append(_SUBSTITUENT_MAP[nbr_num])
            continue

        # Oxygen-based substituents
        if nbr_num == 8:
            bond = mol.GetBondBetweenAtoms(c_idx, nbr.GetIdx())
            if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                has_oh = False
                has_or = False
                for nbr2 in atom.GetNeighbors():
                    if (
                        nbr2.GetAtomicNum() == 8
                        and nbr2.GetIdx() != nbr.GetIdx()
                    ):
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
                if nbr.GetTotalNumHs() > 0:
                    subs.append("OH")
                else:
                    subs.append("OR")
            continue

        # Nitrogen-based substituents
        if nbr_num == 7:
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

        # Sulfur-based substituents
        if nbr_num == 16:
            if nbr.GetTotalNumHs() > 0:
                subs.append("SH")
            else:
                subs.append("SR")
            continue

        # Carbon-based substituents
        if nbr_num == 6:
            if nbr.GetIsAromatic():
                if not parent_is_aromatic:
                    subs.append("phenyl")
            else:
                bond = mol.GetBondBetweenAtoms(c_idx, nbr.GetIdx())
                if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                    subs.append("C=C")
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


def _compute_aromatic_shift(mol: Mol, parent_idx: int) -> float:
    """Compute aromatic proton shift with substituent effects.

    Uses Hammett-type corrections based on ring substituent positions.
    """
    base = BASE_SHIFTS["aromatic"]

    ring_info = mol.GetRingInfo()

    correction = 0.0
    ring_count = 0

    for ring in ring_info.AtomRings():
        if len(ring) != 6 or parent_idx not in ring:
            continue
        if not all(mol.GetAtomWithIdx(a).GetIsAromatic() for a in ring):
            continue

        ring_count += 1
        ring_list = list(ring)
        my_pos = ring_list.index(parent_idx)

        for ring_pos, ring_atom_idx in enumerate(ring_list):
            if ring_atom_idx == parent_idx:
                continue
            ring_atom = mol.GetAtomWithIdx(ring_atom_idx)

            for nbr in ring_atom.GetNeighbors():
                if nbr.GetIdx() in ring_list:
                    continue
                if nbr.GetAtomicNum() == 1:
                    continue

                dist = min(
                    abs(ring_pos - my_pos),
                    6 - abs(ring_pos - my_pos),
                )

                if dist not in (1, 2, 3):
                    continue

                pos_key = {1: "ortho", 2: "meta", 3: "para"}[dist]

                sub_key = _classify_ring_substituent(mol, nbr)
                if sub_key and sub_key in AROMATIC_SUBSTITUENT_EFFECTS:
                    effect = AROMATIC_SUBSTITUENT_EFFECTS[sub_key].get(
                        pos_key, 0.0
                    )
                    correction += effect

    if ring_count == 0:
        return base

    return round(base + correction / max(ring_count, 1), 2)


def _classify_ring_substituent(mol: Mol, atom) -> str | None:  # noqa: ANN001
    """Classify a substituent atom attached to an aromatic ring."""
    num = atom.GetAtomicNum()

    if num in _SUBSTITUENT_MAP:
        return _SUBSTITUENT_MAP[num]

    if num == 8:
        for nbr in atom.GetNeighbors():
            bond = mol.GetBondBetweenAtoms(atom.GetIdx(), nbr.GetIdx())
            if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                if nbr.GetAtomicNum() == 6:
                    return "C=O_ketone"
        if atom.GetTotalNumHs() > 0:
            return "OH"
        return "OR"

    if num == 7:
        o_count = sum(
            1 for n in atom.GetNeighbors() if n.GetAtomicNum() == 8
        )
        if o_count >= 2:
            return "NO2"
        if atom.GetTotalNumHs() >= 2:
            return "NH2"
        return "NR2"

    if num == 16:
        if atom.GetTotalNumHs() > 0:
            return "SH"
        return "SR"

    if num == 6:
        for nbr in atom.GetNeighbors():
            if nbr.GetAtomicNum() == 8:
                bond = mol.GetBondBetweenAtoms(atom.GetIdx(), nbr.GetIdx())
                if bond is not None and bond.GetBondTypeAsDouble() == 2.0:
                    for nbr2 in atom.GetNeighbors():
                        if (
                            nbr2.GetAtomicNum() == 8
                            and nbr2.GetIdx() != nbr.GetIdx()
                        ):
                            return "COOH"
                    if atom.GetTotalNumHs() > 0:
                        return "CHO"
                    return "C=O_ketone"
            if nbr.GetAtomicNum() == 7:
                bond = mol.GetBondBetweenAtoms(atom.GetIdx(), nbr.GetIdx())
                if bond is not None and bond.GetBondTypeAsDouble() == 3.0:
                    return "CN"
        return "alkyl"

    return None


def _confidence_from_counts(env_key: str) -> int:
    """Map reference count to confidence tier (1-3)."""
    count = CONFIDENCE_REFERENCE_COUNTS.get(env_key, 0)
    if count >= 10:
        return 3
    if count >= 3:
        return 2
    return 1


def _apply_solvent_correction(
    shift: float, env_key: str, solvent: str,
) -> float:
    """Apply solvent-dependent shift correction."""
    offsets = SOLVENT_PROTON_OFFSETS.get(solvent, {})
    correction = offsets.get(env_key, 0.0)
    return round(shift + correction, 2)


# ---------------------------------------------------------------------------
# Multiplicity computation
# ---------------------------------------------------------------------------

def _compute_multiplicity_and_coupling(
    mol: Mol,
    parent_idx: int,
    env_key: str,
    peak_h_indices: list[int],
) -> tuple[str, list[float]]:
    """Compute multiplicity and J-coupling for a proton group.

    Uses the n+1 rule: counts vicinal protons (3-bond neighbors that are H)
    to determine splitting pattern. Returns (multiplicity_str, [J_values]).
    """
    # Heteroatom-bound protons are typically singlets (broad)
    if env_key in (
        "hydroxyl_oh", "amine_nh", "amide_nh",
        "carboxylic_acid", "thiol_sh",
    ):
        return "s", []

    # Aldehyde: coupled to alpha-CH
    if env_key == "aldehyde":
        alpha_h_count = _count_vicinal_h(mol, parent_idx, peak_h_indices)
        if alpha_h_count == 0:
            return "s", []
        j = J_COUPLING_CONSTANTS["vicinal_aldehyde"]
        mult = _multiplicity_from_count(alpha_h_count)
        return mult, [round(j, 1)]

    # Aromatic: determine coupling pattern from ring neighbors
    if env_key == "aromatic":
        return _aromatic_multiplicity(mol, parent_idx, peak_h_indices)

    # General case: count vicinal H atoms (3-bond path)
    vicinal_h_count = _count_vicinal_h(mol, parent_idx, peak_h_indices)

    if vicinal_h_count == 0:
        return "s", []

    # Determine J value based on environment
    if env_key in ("vinyl",):
        j = J_COUPLING_CONSTANTS["vicinal_sp3_sp2"]
    elif env_key in ("alpha_to_oxygen", "alpha_to_nitrogen"):
        j = J_COUPLING_CONSTANTS["vicinal_alpha_hetero"]
    else:
        j = J_COUPLING_CONSTANTS["vicinal_sp3_sp3"]

    mult = _multiplicity_from_count(vicinal_h_count)
    return mult, [round(j, 1)]


def _count_vicinal_h(
    mol: Mol, parent_idx: int, own_h_indices: list[int],
) -> int:
    """Count hydrogen atoms 3 bonds away from parent carbon (vicinal H).

    Excludes H atoms that are part of the same equivalent group.
    """
    parent = mol.GetAtomWithIdx(parent_idx)
    vicinal_h = 0
    own_h_set = set(own_h_indices)

    for nbr in parent.GetNeighbors():
        if nbr.GetAtomicNum() == 1:
            continue
        for nbr2 in nbr.GetNeighbors():
            if nbr2.GetIdx() == parent_idx:
                continue
            if nbr2.GetAtomicNum() == 1 and nbr2.GetIdx() not in own_h_set:
                vicinal_h += 1

    return vicinal_h


def _aromatic_multiplicity(
    mol: Mol, parent_idx: int, own_h_indices: list[int],
) -> tuple[str, list[float]]:
    """Compute aromatic proton multiplicity from ortho-H neighbors."""
    parent = mol.GetAtomWithIdx(parent_idx)
    ortho_h_count = 0
    own_h_set = set(own_h_indices)

    for nbr in parent.GetNeighbors():
        if not nbr.GetIsAromatic():
            continue
        if nbr.GetAtomicNum() != 6:
            continue
        for nbr2 in nbr.GetNeighbors():
            if nbr2.GetAtomicNum() == 1 and nbr2.GetIdx() not in own_h_set:
                ortho_h_count += 1

    if ortho_h_count == 0:
        return "s", []

    j = J_COUPLING_CONSTANTS["vicinal_aromatic_ortho"]
    mult = _multiplicity_from_count(ortho_h_count)
    return mult, [round(j, 1)]


def _multiplicity_from_count(n: int) -> str:
    """Convert number of coupled protons to multiplicity string (n+1 rule)."""
    labels = {
        0: "s", 1: "d", 2: "t", 3: "q",
        4: "quint", 5: "sext", 6: "sept",
    }
    return labels.get(n, "m")


# ---------------------------------------------------------------------------
# Main prediction function
# ---------------------------------------------------------------------------

def predict_additive(
    mol: Mol,
    solvent: str = DEFAULT_SOLVENT,
) -> list[NmrPeak]:
    """Predict 1H NMR chemical shifts using additive increment method.

    Pure function: same mol + solvent always produces identical output.
    Peaks are sorted by shift_ppm descending, then by first atom_index ascending.
    Chemically equivalent protons are grouped into single peaks.
    """
    from rdkit import Chem

    mol_h = Chem.AddHs(mol)

    # Collect raw predictions per hydrogen
    raw_predictions: list[tuple[int, int, float, str, int]] = []

    for atom in mol_h.GetAtoms():
        if atom.GetAtomicNum() != 1:
            continue

        h_idx = atom.GetIdx()
        neighbors = atom.GetNeighbors()
        if not neighbors:
            continue
        parent_idx = neighbors[0].GetIdx()

        env_key, substituent_keys = _classify_h_environment(
            mol_h, h_idx, parent_idx
        )

        # Base shift — special handling for aromatic
        if env_key == "aromatic":
            base_shift = _compute_aromatic_shift(mol_h, parent_idx)
        else:
            base_shift = BASE_SHIFTS.get(env_key, BASE_SHIFTS["methyl"])

        # Sum substituent increments
        increment = 0.0
        for sub_key in substituent_keys:
            increment += SUBSTITUENT_INCREMENTS.get(sub_key, 0.0)

        shift_ppm = base_shift + increment

        # Apply solvent correction
        shift_ppm = _apply_solvent_correction(shift_ppm, env_key, solvent)

        confidence = _confidence_from_counts(env_key)

        raw_predictions.append(
            (h_idx, parent_idx, shift_ppm, env_key, confidence)
        )

    # Group equivalent protons (same shift and same environment)
    groups: dict[tuple[float, str], list[int]] = {}
    parent_map: dict[tuple[float, str], int] = {}
    confidence_map: dict[tuple[float, str], int] = {}
    for h_idx, parent_idx, shift, env, conf in raw_predictions:
        key = (shift, env)
        if key not in groups:
            groups[key] = []
            parent_map[key] = parent_idx
            confidence_map[key] = conf
        groups[key].append(h_idx)

    # Build peaks with multiplicity
    peaks: list[NmrPeak] = []
    for (shift, env), indices in groups.items():
        sorted_indices = sorted(indices)
        parent_idx = parent_map[(shift, env)]

        mult, coupling = _compute_multiplicity_and_coupling(
            mol_h, parent_idx, env, sorted_indices,
        )

        peaks.append(
            NmrPeak(
                atom_index=sorted_indices[0],
                atom_indices=sorted_indices,
                shift_ppm=shift,
                integral=len(sorted_indices),
                multiplicity=mult,
                coupling_hz=coupling,
                environment=env,
                confidence=confidence_map[(shift, env)],
                method="additive",
            )
        )

    # Sort: shift_ppm descending, then first atom_index ascending
    peaks.sort(key=lambda p: (-p.shift_ppm, p.atom_index))

    return peaks
