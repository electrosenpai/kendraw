#!/usr/bin/env bash
set -euo pipefail

# Force a clean frontend rebuild. Vite bakes VITE_* values at build time, so
# a stale Docker layer can reproduce the require-is-not-defined crash from
# wave-8 if the commonjs transform flag ever regresses (see
# packages/ui/vite.config.ts for context). Backend layers are cache-safe.
docker compose -f docker/docker-compose.yml build --no-cache frontend
docker compose -f docker/docker-compose.yml up -d --build

git push origin main
