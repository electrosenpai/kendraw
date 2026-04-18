"""Structure cleanup service.

Wave-7 HF-3. Cleans / refines a MOL V2000 block:
- mode="quick": RDKit Cleanup + SanitizeMol, preserves user's layout
- mode="full":  RDKit Compute2DCoords, recomputes the 2D layout

Returns a cleaned MOL block. If RDKit is not available the input is
returned verbatim so callers degrade gracefully rather than crashing.
"""

from typing import Literal

from pydantic import BaseModel

CleanMode = Literal["quick", "full"]


class CleanResult(BaseModel):
    """Cleanup outcome. `changed` is True when RDKit actually mutated the block."""

    mol_block: str
    mode: CleanMode
    success: bool
    changed: bool = False
    error: str | None = None


class StructureService:
    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # noqa: F401

            self._rdkit_available = True
        except ImportError:
            pass

    def clean(self, mol_block: str, mode: CleanMode = "quick") -> CleanResult:
        if not mol_block.strip():
            return CleanResult(
                mol_block="",
                mode=mode,
                success=False,
                error="Empty MOL block",
            )
        if not self._rdkit_available:
            return CleanResult(
                mol_block=mol_block,
                mode=mode,
                success=False,
                error="RDKit not available",
            )
        try:
            cleaned = self._clean_rdkit(mol_block, mode)
            return CleanResult(
                mol_block=cleaned,
                mode=mode,
                success=True,
                changed=cleaned != mol_block,
            )
        except Exception as e:
            return CleanResult(
                mol_block=mol_block,
                mode=mode,
                success=False,
                error=str(e),
            )

    def _clean_rdkit(self, mol_block: str, mode: CleanMode) -> str:
        from rdkit import Chem
        from rdkit.Chem import AllChem

        mol = Chem.MolFromMolBlock(mol_block)
        if mol is None:
            msg = "Failed to parse MOL block"
            raise ValueError(msg)
        Chem.SanitizeMol(mol)
        if mode == "full":
            AllChem.Compute2DCoords(mol)  # type: ignore[attr-defined]
        return str(Chem.MolToMolBlock(mol))
