"""OPSIN integration scaffold — POC #4 kickoff.

OPSIN (Open Parser for Systematic IUPAC Nomenclature) is an open-source
Java library (Apache-2.0) that converts IUPAC names to structures.

Integration path: py2opsin (Python wrapper that shells out to OPSIN jar).
Requires JRE in the Docker image — only added in V1 (FR-040, FR-041).

Architecture references:
- docs/architecture-kendraw-2026-04-12.md §4.2, §5.2.2 (NamingService)
- docs/architecture-kendraw-2026-04-12.md §15.1 (POC #4)
- TO-008 (OPSIN deferred to V1)
"""


class OpsinError(Exception):
    """Raised when OPSIN conversion fails."""


class OpsinClient:
    """Client for OPSIN IUPAC name -> structure conversion.

    Placeholder — real implementation in V1 after POC #4 validates coverage.

    Integration options evaluated:
    1. py2opsin (pip install py2opsin) — shells out to OPSIN jar.
       Pros: simple, well-maintained, MIT-compatible.
       Cons: requires JRE, cold start ~2-3 s, adds ~100 MB to Docker image.

    2. OPSIN as sidecar JVM service — HTTP API in a separate container.
       Pros: isolates JVM from Python process, can restart independently.
       Cons: two containers for naming only, complexity for marginal benefit.

    3. STOUT (ML-based IUPAC translator) — pure Python, no JVM.
       Pros: no JRE dependency.
       Cons: less accurate than OPSIN, heavy ML deps (torch), ~500 MB.

    Recommendation: py2opsin (option 1). Simplest, most accurate, JRE cost
    is acceptable in V1 Docker image (~300 MB total with JRE, vs ~200 MB without).
    """

    def iupac_to_smiles(self, name: str) -> str:
        """Convert IUPAC name to SMILES string.

        Not yet implemented.
        """
        raise NotImplementedError("OPSIN integration not yet implemented. V1 feature.")

    def iupac_to_mol(self, name: str) -> str:
        """Convert IUPAC name to MOL block.

        Not yet implemented.
        """
        raise NotImplementedError("OPSIN integration not yet implemented. V1 feature.")
