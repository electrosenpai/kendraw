"""Chemistry property computations.

Provides molecular formula, MW, exact mass, canonical SMILES, InChI, and InChIKey
from a MOL block input. Uses RDKit when available, falls back to stub for basic props.
"""

from pydantic import BaseModel


class MolecularProperties(BaseModel):
    """Computed molecular properties."""

    formula: str
    molecular_weight: float
    exact_mass: float
    canonical_smiles: str
    inchi: str
    inchi_key: str


class ComputeService:
    """Chemistry property computations.

    Attempts to use RDKit for full computation.
    Falls back to a basic stub if RDKit is not available.
    """

    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # type: ignore[import-not-found]  # noqa: F401

            self._rdkit_available = True
        except ImportError:
            pass

    def compute_from_smiles(self, smiles: str) -> MolecularProperties:
        """Compute properties from a SMILES string."""
        if self._rdkit_available:
            return self._compute_rdkit(smiles)
        return self._compute_stub(smiles)

    def compute_from_mol(self, mol_block: str) -> MolecularProperties:
        """Compute properties from a MOL block string."""
        if self._rdkit_available:
            return self._compute_rdkit_mol(mol_block)
        return MolecularProperties(
            formula="",
            molecular_weight=0.0,
            exact_mass=0.0,
            canonical_smiles="",
            inchi="",
            inchi_key="",
        )

    def _compute_rdkit(self, smiles: str) -> MolecularProperties:
        from rdkit import Chem
        from rdkit.Chem import Descriptors, inchi  # type: ignore[import-not-found]

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            msg = f"Invalid SMILES: {smiles}"
            raise ValueError(msg)

        return MolecularProperties(
            formula=Chem.rdMolDescriptors.CalcMolFormula(mol),
            molecular_weight=round(Descriptors.MolWt(mol), 3),
            exact_mass=round(Descriptors.ExactMolWt(mol), 6),
            canonical_smiles=Chem.MolToSmiles(mol),
            inchi=inchi.MolToInchi(mol) or "",
            inchi_key=inchi.InchiToInchiKey(inchi.MolToInchi(mol) or "") or "",
        )

    def _compute_rdkit_mol(self, mol_block: str) -> MolecularProperties:
        from rdkit import Chem

        mol = Chem.MolFromMolBlock(mol_block)
        if mol is None:
            msg = "Invalid MOL block"
            raise ValueError(msg)
        return self._compute_rdkit(Chem.MolToSmiles(mol))

    def _compute_stub(self, smiles: str) -> MolecularProperties:
        """Fallback stub when RDKit is not available."""
        return MolecularProperties(
            formula="",
            molecular_weight=0.0,
            exact_mass=0.0,
            canonical_smiles=smiles,
            inchi="",
            inchi_key="",
        )
