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
