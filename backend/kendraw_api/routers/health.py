import platform
import sys

from fastapi import APIRouter
from pydantic import BaseModel

from kendraw_settings.config import get_settings

router = APIRouter(tags=["system"])


class NmrStatus(BaseModel):
    method: str
    engine_version: str
    environments: int


class HealthResponse(BaseModel):
    status: str
    nmr: NmrStatus | None = None


class VersionResponse(BaseModel):
    version: str
    commit: str
    disclaimer: str


class ReproducibilityResponse(BaseModel):
    """Deterministic build + runtime fingerprint for reproducible predictions."""

    app_version: str
    commit: str
    nmr_engine_version: str
    python_version: str
    platform: str
    rdkit_version: str | None
    disclaimer: str


@router.get("/health")
def health() -> HealthResponse:
    try:
        from kendraw_chem.nmr.nmr_service import ENGINE_VERSION
        from kendraw_chem.nmr.shift_tables import BASE_SHIFTS

        nmr = NmrStatus(
            method="additive",
            engine_version=ENGINE_VERSION,
            environments=len(BASE_SHIFTS),
        )
    except Exception:
        nmr = None
    return HealthResponse(status="ok", nmr=nmr)


@router.get("/version")
def version() -> VersionResponse:
    settings = get_settings()
    return VersionResponse(
        version="0.0.0",
        commit=settings.git_commit,
        disclaimer=settings.disclaimer,
    )


@router.get("/reproducibility")
def reproducibility() -> ReproducibilityResponse:
    """Snapshot of versions relevant for reproducing a prediction run."""
    from kendraw_chem.nmr.nmr_service import ENGINE_VERSION

    settings = get_settings()
    rdkit_version: str | None
    try:
        import rdkit

        rdkit_version = rdkit.__version__
    except ImportError:
        rdkit_version = None

    return ReproducibilityResponse(
        app_version="0.0.0",
        commit=settings.git_commit,
        nmr_engine_version=ENGINE_VERSION,
        python_version=sys.version.split()[0],
        platform=platform.platform(),
        rdkit_version=rdkit_version,
        disclaimer=settings.disclaimer,
    )
