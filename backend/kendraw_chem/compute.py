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
    # Molecular descriptors (drug design)
    logp: float | None = None
    tpsa: float | None = None
    hbd: int | None = None  # H-bond donors
    hba: int | None = None  # H-bond acceptors
    rotatable_bonds: int | None = None
    lipinski_pass: bool | None = None


class ComputeService:
    """Chemistry property computations.

    Attempts to use RDKit for full computation.
    Falls back to a basic stub if RDKit is not available.
    """

    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # noqa: F401

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
        from rdkit.Chem import Descriptors, Lipinski, inchi, rdMolDescriptors

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            msg = f"Invalid SMILES: {smiles}"
            raise ValueError(msg)

        mw = round(Descriptors.MolWt(mol), 3)  # type: ignore[attr-defined]
        logp = round(Descriptors.MolLogP(mol), 3)  # type: ignore[attr-defined]
        tpsa = round(rdMolDescriptors.CalcTPSA(mol), 2)
        hbd = Lipinski.NumHDonors(mol)  # type: ignore[attr-defined]
        hba = Lipinski.NumHAcceptors(mol)  # type: ignore[attr-defined]
        rotatable = Lipinski.NumRotatableBonds(mol)  # type: ignore[attr-defined]
        # Lipinski Rule of 5: MW <= 500, LogP <= 5, HBD <= 5, HBA <= 10
        lipinski = mw <= 500 and logp <= 5 and hbd <= 5 and hba <= 10

        return MolecularProperties(
            formula=rdMolDescriptors.CalcMolFormula(mol),
            molecular_weight=mw,
            exact_mass=round(Descriptors.ExactMolWt(mol), 6),  # type: ignore[attr-defined]
            canonical_smiles=Chem.MolToSmiles(mol),
            inchi=inchi.MolToInchi(mol) or "",  # type: ignore[no-untyped-call]
            inchi_key=inchi.InchiToInchiKey(  # type: ignore[no-untyped-call]
                inchi.MolToInchi(mol) or ""  # type: ignore[no-untyped-call]
            )
            or "",
            logp=logp,
            tpsa=tpsa,
            hbd=hbd,
            hba=hba,
            rotatable_bonds=rotatable,
            lipinski_pass=lipinski,
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
