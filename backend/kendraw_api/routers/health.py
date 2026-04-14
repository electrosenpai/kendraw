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
    return VersionResponse(version="0.0.0", commit=settings.git_commit)
