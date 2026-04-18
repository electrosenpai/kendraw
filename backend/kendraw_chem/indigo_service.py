"""Indigo (EPAM) cheminformatics wrapper service.

Indigo complements RDKit with high-quality 2D layout, native molecule
merging (`merge` + `mapAtom`), and stable rendering — used by Wave-8
template fusion. RDKit remains the engine for property calc, NMR,
and SMILES/InChI conversion.

Per Indigo's official docs:

    "It is allowable to have multiple Indigo instances within one
    program and even in different threads. However, using a single
    Indigo instance across multiple threads is prohibited."

FastAPI sync endpoints run inside Starlette's threadpool, so we hold
one `Indigo()` per thread via `threading.local()` rather than the
single-global pattern.
"""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass


class IndigoService:
    """Thin facade over Indigo with thread-local instances."""

    def __init__(self) -> None:
        self._indigo_available = False
        self._tls = threading.local()
        try:
            import indigo  # type: ignore[import-untyped]  # noqa: F401

            self._indigo_available = True
        except ImportError:
            pass

    def is_available(self) -> bool:
        return self._indigo_available

    def _instance(self) -> Any:
        if not self._indigo_available:
            msg = "Indigo not available"
            raise RuntimeError(msg)
        inst = getattr(self._tls, "indigo", None)
        if inst is None:
            from indigo import Indigo

            inst = Indigo()
            inst.setOption("aromaticity-model", "basic")
            self._tls.indigo = inst
        return inst

    def version(self) -> str:
        return str(self._instance().version())

    def load_molfile(self, text: str) -> str:
        """Parse a SMILES or MOL block, return canonical V2000 molfile."""
        mol = self._instance().loadMolecule(text)
        return str(mol.molfile())

    def layout_molfile(self, mol_block: str) -> str:
        """Recompute 2D coordinates via Indigo's layout engine."""
        mol = self._instance().loadMolecule(mol_block)
        mol.layout()
        return str(mol.molfile())

    def fuse_template_atom(
        self,
        scene_mol_block: str,
        template_smiles: str,
        scene_atom_index: int,
        template_anchor_index: int = 0,
    ) -> str:
        """Edge-share-free fusion: template's `template_anchor_index` atom is
        merged onto scene's `scene_atom_index` atom (vertex sharing — used to
        attach a ring to a terminal atom, e.g. methyl + benzene → toluene).

        Returns a freshly laid-out V2000 molfile.
        """
        ind = self._instance()
        scene = ind.loadMolecule(scene_mol_block)
        template = ind.loadMolecule(template_smiles)
        if scene_atom_index < 0 or scene_atom_index >= scene.countAtoms():
            msg = f"scene_atom_index {scene_atom_index} out of range"
            raise IndexError(msg)
        if template_anchor_index < 0 or template_anchor_index >= template.countAtoms():
            msg = f"template_anchor_index {template_anchor_index} out of range"
            raise IndexError(msg)

        scene_anchor = scene.getAtom(scene_atom_index)
        mapping = scene.merge(template)
        duplicate = mapping.mapAtom(template.getAtom(template_anchor_index))

        rewire: list[tuple[int, int]] = []
        for nbr in duplicate.iterateNeighbors():
            rewire.append((nbr.index(), nbr.bond().bondOrder()))
        for nidx, order in rewire:
            scene_anchor.addBond(scene.getAtom(nidx), order)
        duplicate.remove()
        scene.layout()
        return str(scene.molfile())

    def fuse_template_bond(
        self,
        scene_mol_block: str,
        template_smiles: str,
        scene_bond_index: int,
        template_anchor_a_index: int = 0,
        template_anchor_b_index: int = 1,
    ) -> str:
        """Edge-sharing fusion: the template's anchor edge `(a, b)` is merged
        onto the scene's `scene_bond_index` edge (used to fuse a ring onto a
        bond, e.g. benzene + benzene → naphthalene).

        Returns a freshly laid-out V2000 molfile.
        """
        ind = self._instance()
        scene = ind.loadMolecule(scene_mol_block)
        template = ind.loadMolecule(template_smiles)
        if scene_bond_index < 0 or scene_bond_index >= scene.countBonds():
            msg = f"scene_bond_index {scene_bond_index} out of range"
            raise IndexError(msg)
        for label, idx in (
            ("template_anchor_a_index", template_anchor_a_index),
            ("template_anchor_b_index", template_anchor_b_index),
        ):
            if idx < 0 or idx >= template.countAtoms():
                msg = f"{label} {idx} out of range"
                raise IndexError(msg)
        if template_anchor_a_index == template_anchor_b_index:
            msg = "template anchor a/b must differ"
            raise ValueError(msg)

        scene_bond = scene.getBond(scene_bond_index)
        sa_idx = scene_bond.source().index()
        sb_idx = scene_bond.destination().index()
        scene_a = scene.getAtom(sa_idx)
        scene_b = scene.getAtom(sb_idx)

        mapping = scene.merge(template)
        dup_a = mapping.mapAtom(template.getAtom(template_anchor_a_index))
        dup_b = mapping.mapAtom(template.getAtom(template_anchor_b_index))
        dup_a_idx = dup_a.index()
        dup_b_idx = dup_b.index()

        rewire_a: list[tuple[int, int]] = []
        for nbr in dup_a.iterateNeighbors():
            if nbr.index() == dup_b_idx:
                continue
            rewire_a.append((nbr.index(), nbr.bond().bondOrder()))
        rewire_b: list[tuple[int, int]] = []
        for nbr in dup_b.iterateNeighbors():
            if nbr.index() == dup_a_idx:
                continue
            rewire_b.append((nbr.index(), nbr.bond().bondOrder()))

        for nidx, order in rewire_a:
            scene_a.addBond(scene.getAtom(nidx), order)
        for nidx, order in rewire_b:
            scene_b.addBond(scene.getAtom(nidx), order)

        dup_a.remove()
        dup_b.remove()
        scene.layout()
        return str(scene.molfile())
