from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from kendraw_api.routers.compute import router as compute_router
from kendraw_api.routers.convert import router as convert_router
from kendraw_api.routers.health import router as health_router
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
    app = FastAPI(
        title="Kendraw API",
        description="Chemistry compute backend for Kendraw",
        version="0.0.0",
        lifespan=lifespan,
    )
    app.include_router(health_router)
    app.include_router(compute_router)
    app.include_router(convert_router)
    return app


app = create_app()
