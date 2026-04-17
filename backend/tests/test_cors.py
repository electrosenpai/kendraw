"""CORS middleware configuration tests — wave-1 P1-10."""

from fastapi.testclient import TestClient


def test_cors_middleware_registered_when_origins_configured(monkeypatch) -> None:
    """CORSMiddleware must be wired when cors_origins is non-empty."""
    monkeypatch.setenv("KENDRAW_CORS_ORIGINS", "http://localhost:5173")
    from kendraw_settings.config import get_settings

    get_settings.cache_clear()

    from kendraw_api.main import create_app

    app = create_app()
    client = TestClient(app)

    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Preflight must succeed and echo the origin back.
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

    get_settings.cache_clear()


def test_cors_multiple_origins_parsed(monkeypatch) -> None:
    """Comma-separated origins are split and both are allowed."""
    monkeypatch.setenv(
        "KENDRAW_CORS_ORIGINS",
        "http://localhost:5173, https://kendraw.fdp.expert",
    )
    from kendraw_settings.config import get_settings

    get_settings.cache_clear()

    from kendraw_api.main import create_app

    app = create_app()
    client = TestClient(app)

    for origin in ("http://localhost:5173", "https://kendraw.fdp.expert"):
        response = client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code in (200, 204)
        assert response.headers.get("access-control-allow-origin") == origin

    get_settings.cache_clear()


def test_disclaimer_setting_present_by_default() -> None:
    """Settings exposes a non-empty disclaimer used in NMR metadata and /version."""
    from kendraw_settings.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.disclaimer
    assert "approximate" in settings.disclaimer.lower()
