"""CDXML conversion scaffold — POC #3 kickoff.

CDXML (ChemDraw XML) is a semi-documented XML format used by PerkinElmer's
ChemDraw application. This module will implement import/export when the URD
Abbaye corpus arrives for validation.

Current status: scaffold only, no functional code.
Full implementation: V1 (FR-043), after POC #3 validates on real corpus.

Architecture references:
- docs/architecture-kendraw-2026-04-12.md §5.2.2 (ConvertService)
- docs/architecture-kendraw-2026-04-12.md §15.1 (POC #3)
- docs/test-corpus-plan.md §2 (CDXML corpus)
"""


class CdxmlParserError(Exception):
    """Raised when CDXML parsing fails."""


class CdxmlParser:
    """Parse CDXML files into Kendraw scene model.

    Placeholder — real implementation after POC #3 corpus validation.

    Known challenges (from initial exploration):
    - CDXML is XML but with binary-encoded coordinates (base64 in some versions)
    - Multiple ChemDraw versions produce different CDXML dialects (16.x-21.x)
    - Curly arrows, annotations, and conditions have no standard CDXML encoding
    - RDKit can read some CDXML via MolFromMolBlock after conversion, but
      loses arrows/annotations (chemistry-only, no graphics)

    Approach candidates:
    1. Pure Python XML parser (lxml) for structure + graphics
    2. RDKit for chemistry validation post-parse
    3. Frontend TS parser for common subset, backend fallback for exotic cases
    """

    def parse(self, cdxml_content: str) -> dict:  # type: ignore[type-arg]
        """Parse CDXML content into a scene model dict.

        Not yet implemented — returns empty dict.
        """
        raise NotImplementedError("CDXML parsing not yet implemented. Awaiting POC #3 corpus.")

    def write(self, scene_model: dict) -> str:  # type: ignore[type-arg]
        """Write scene model to CDXML format.

        Not yet implemented.
        """
        raise NotImplementedError("CDXML writing not yet implemented.")
