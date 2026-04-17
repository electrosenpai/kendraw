from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Kendraw backend configuration, driven by KENDRAW_* env vars."""

    host: str = "0.0.0.0"
    port: int = 8081
    log_level: str = "info"
    git_commit: str = "unknown"
    max_mol_atoms: int = 5000
    cors_origins: str = ""
    api_key: str = ""
    # Disclaimer surfaced on /version and in NmrMetadata so callers can
    # display a warning about prediction approximations.
    disclaimer: str = (
        "Predictions are approximate (additive-increment model) "
        "and must not be used for clinical, regulatory, or safety-critical decisions."
    )

    model_config = {"env_prefix": "KENDRAW_"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
