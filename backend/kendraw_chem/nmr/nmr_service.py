"""NMR prediction service orchestrator.

Follows the ComputeService pattern: probes for RDKit at init,
delegates to additive prediction for MVP, returns stub when
RDKit is unavailable.
"""

from __future__ import annotations

from typing import Any

from kendraw_chem.nmr.models import NmrMetadata, NmrPrediction
from kendraw_chem.nmr.shift_tables import DEFAULT_SOLVENT, SOLVENT_IDS

ENGINE_VERSION = "0.2.0"


class NmrService:
    """NMR prediction service.

    Attempts to use RDKit for molecular analysis and prediction.
    Falls back to stub when RDKit is not available.
    """

    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # noqa: F401

            self._rdkit_available = True
        except ImportError:
            pass

    def predict_nmr(
        self,
        input_str: str,
        format: str = "smiles",
        solvent: str = DEFAULT_SOLVENT,
        nucleus: str = "1H",
    ) -> NmrPrediction:
        """Predict NMR chemical shifts.

        Args:
            input_str: Molecular structure as SMILES or MOL block.
            format: Input format — "smiles" or "mol".
            solvent: Deuterated solvent ID (e.g. "CDCl3", "DMSO-d6").
            nucleus: Nucleus to predict — "1H" or "13C".

        Returns:
            NmrPrediction with peaks and metadata.

        Raises:
            ValueError: If input is invalid or molecule exceeds atom limit.
        """
        if solvent not in SOLVENT_IDS:
            msg = f"Unsupported solvent: {solvent!r}. Supported: {', '.join(SOLVENT_IDS)}"
            raise ValueError(msg)

        if nucleus not in ("1H", "13C"):
            msg = f"Unsupported nucleus: {nucleus!r}. Supported: '1H', '13C'"
            raise ValueError(msg)

        if not self._rdkit_available:
            return self._stub_prediction(solvent, nucleus)
        return self._predict_rdkit(input_str, format, solvent, nucleus)

    def _predict_rdkit(
        self,
        input_str: str,
        format: str,
        solvent: str,
        nucleus: str = "1H",
    ) -> NmrPrediction:
        from kendraw_settings.config import get_settings

        mol = self._parse_input(input_str, format)

        # Atom count validation
        settings = get_settings()
        num_atoms = mol.GetNumAtoms()
        if num_atoms > settings.max_mol_atoms:
            msg = f"Molecule has {num_atoms} atoms, exceeds limit of {settings.max_mol_atoms}"
            raise ValueError(msg)

        if nucleus == "13C":
            from kendraw_chem.nmr.additive_13c import predict_additive_13c

            peaks = predict_additive_13c(mol, solvent=solvent)
            method = "additive-13C"
        else:
            from kendraw_chem.nmr.additive import predict_additive

            peaks = predict_additive(mol, solvent=solvent)
            method = "additive"

        return NmrPrediction(
            nucleus=nucleus,
            solvent=solvent,
            peaks=peaks,
            metadata=NmrMetadata(
                engine_version=ENGINE_VERSION,
                data_version=None,
                method=method,
                disclaimer=settings.disclaimer,
            ),
        )

    @staticmethod
    def _parse_input(input_str: str, format: str) -> Any:
        from rdkit import Chem

        if format == "mol":
            mol = Chem.MolFromMolBlock(input_str)
            if mol is None:
                msg = "Invalid MOL block"
                raise ValueError(msg)
            return mol

        if format == "smiles":
            mol = Chem.MolFromSmiles(input_str)
            if mol is None or mol.GetNumAtoms() == 0:
                msg = f"Invalid SMILES: {input_str!r}"
                raise ValueError(msg)
            return mol

        msg = f"Unsupported format: {format!r}. Expected 'smiles' or 'mol'."
        raise ValueError(msg)

    @staticmethod
    def _stub_prediction(solvent: str = DEFAULT_SOLVENT, nucleus: str = "1H") -> NmrPrediction:
        from kendraw_settings.config import get_settings

        return NmrPrediction(
            nucleus=nucleus,
            solvent=solvent,
            peaks=[],
            metadata=NmrMetadata(
                engine_version=ENGINE_VERSION,
                data_version=None,
                method="unavailable",
                disclaimer=get_settings().disclaimer,
            ),
        )
