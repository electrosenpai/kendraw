from fastapi import APIRouter
from pydantic import BaseModel

from kendraw_settings.config import get_settings

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    status: str


class VersionResponse(BaseModel):
    version: str
    commit: str


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/version")
def version() -> VersionResponse:
    settings = get_settings()
    return VersionResponse(version="0.0.0", commit=settings.git_commit)
