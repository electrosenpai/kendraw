"""NMR prediction service orchestrator.

Follows the ComputeService pattern: probes for RDKit at init,
delegates to additive prediction for MVP, returns stub when
RDKit is unavailable.
"""

from __future__ import annotations

from typing import Any

from kendraw_chem.nmr.models import NmrMetadata, NmrPrediction

ENGINE_VERSION = "0.1.0"


class NmrService:
    """NMR prediction service.

    Attempts to use RDKit for molecular analysis and prediction.
    Falls back to stub when RDKit is not available.
    """

    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # type: ignore[import-not-found]  # noqa: F401

            self._rdkit_available = True
        except ImportError:
            pass

    def predict_nmr(
        self,
        input_str: str,
        format: str = "smiles",
    ) -> NmrPrediction:
        """Predict 1H NMR chemical shifts.

        Args:
            input_str: Molecular structure as SMILES or MOL block.
            format: Input format — "smiles" or "mol".

        Returns:
            NmrPrediction with peaks and metadata.

        Raises:
            ValueError: If input is invalid or molecule exceeds atom limit.
        """
        if not self._rdkit_available:
            return self._stub_prediction()
        return self._predict_rdkit(input_str, format)

    def _predict_rdkit(self, input_str: str, format: str) -> NmrPrediction:
        from kendraw_settings.config import get_settings

        mol = self._parse_input(input_str, format)

        # Atom count validation
        settings = get_settings()
        num_atoms = mol.GetNumAtoms()
        if num_atoms > settings.max_mol_atoms:
            msg = (
                f"Molecule has {num_atoms} atoms, "
                f"exceeds limit of {settings.max_mol_atoms}"
            )
            raise ValueError(msg)

        # Run additive prediction (MVP)
        from kendraw_chem.nmr.additive import predict_additive

        peaks = predict_additive(mol)

        return NmrPrediction(
            nucleus="1H",
            peaks=peaks,
            metadata=NmrMetadata(
                engine_version=ENGINE_VERSION,
                data_version=None,
                method="additive",
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
    def _stub_prediction() -> NmrPrediction:
        return NmrPrediction(
            nucleus="1H",
            peaks=[],
            metadata=NmrMetadata(
                engine_version=ENGINE_VERSION,
                data_version=None,
                method="unavailable",
            ),
        )
