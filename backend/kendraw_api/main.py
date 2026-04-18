from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kendraw_api.routers.compute import router as compute_router
from kendraw_api.routers.convert import router as convert_router
from kendraw_api.routers.health import router as health_router
from kendraw_api.routers.nmr import router as nmr_router
from kendraw_api.routers.structure import router as structure_router
from kendraw_observability.logging import setup_logging
from kendraw_settings.config import get_settings


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level)
    logger = structlog.get_logger()
    logger.info(
        "app.startup",
        version="0.0.0",
        host=settings.host,
        port=settings.port,
    )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Kendraw API",
        description="Chemistry compute backend for Kendraw",
        version="0.0.0",
        lifespan=lifespan,
    )

    if settings.cors_origins:
        origins = [o.strip() for o in settings.cors_origins.split(",")]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health_router)
    app.include_router(compute_router)
    app.include_router(convert_router)
    app.include_router(nmr_router)
    app.include_router(structure_router)
    return app


app = create_app()
