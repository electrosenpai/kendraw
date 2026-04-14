"""Chemistry format conversion service.

Supports MOL <-> SDF <-> SMILES <-> InChI conversions.
Uses RDKit when available, falls back to stub.
"""

from pydantic import BaseModel


class ConversionResult(BaseModel):
    """Result of a format conversion."""

    output: str
    input_format: str
    output_format: str
    success: bool
    error: str | None = None


SUPPORTED_FORMATS = ("smiles", "mol", "sdf", "inchi")


class ConvertService:
    """Chemistry format conversion via RDKit."""

    def __init__(self) -> None:
        self._rdkit_available = False
        try:
            from rdkit import Chem  # noqa: F401

            self._rdkit_available = True
        except ImportError:
            pass

    def convert(
        self,
        input_data: str,
        input_format: str,
        output_format: str,
    ) -> ConversionResult:
        """Convert between chemistry formats."""
        if input_format not in SUPPORTED_FORMATS:
            return ConversionResult(
                output="",
                input_format=input_format,
                output_format=output_format,
                success=False,
                error=f"Unsupported input format: {input_format}",
            )
        if output_format not in SUPPORTED_FORMATS:
            return ConversionResult(
                output="",
                input_format=input_format,
                output_format=output_format,
                success=False,
                error=f"Unsupported output format: {output_format}",
            )

        if not self._rdkit_available:
            return ConversionResult(
                output="",
                input_format=input_format,
                output_format=output_format,
                success=False,
                error="RDKit not available",
            )

        try:
            result = self._convert_rdkit(input_data, input_format, output_format)
            return ConversionResult(
                output=result,
                input_format=input_format,
                output_format=output_format,
                success=True,
            )
        except Exception as e:
            return ConversionResult(
                output="",
                input_format=input_format,
                output_format=output_format,
                success=False,
                error=str(e),
            )

    def _convert_rdkit(
        self,
        input_data: str,
        input_format: str,
        output_format: str,
    ) -> str:
        from rdkit import Chem
        from rdkit.Chem import inchi

        # Parse input
        mol = None
        if input_format == "smiles":
            mol = Chem.MolFromSmiles(input_data)
        elif input_format == "mol":
            mol = Chem.MolFromMolBlock(input_data)
        elif input_format == "inchi":
            mol = inchi.MolFromInchi(input_data)

        if mol is None:
            msg = f"Failed to parse {input_format} input"
            raise ValueError(msg)

        # Write output
        if output_format == "smiles":
            return str(Chem.MolToSmiles(mol))
        elif output_format == "mol":
            return str(Chem.MolToMolBlock(mol))
        elif output_format == "inchi":
            result = inchi.MolToInchi(mol)
            if result is None:
                msg = "Failed to generate InChI"
                raise ValueError(msg)
            return str(result)

        msg = f"Unsupported output format: {output_format}"
        raise ValueError(msg)
