# API Endpoints Map — Backend ↔ Frontend

_Last audit: 2026-04-16 — after fix for Bug 3 (`/v1` prefix 404)._

This document is the single source of truth for how the frontend reaches the
backend. It exists because a mismatched URL prefix in `PropertyPanel.tsx`
silently 404'd for weeks; every endpoint listed here was verified by code
inspection and covered by an E2E regression test in
`e2e/regression/bug-api-v1-prefix-404.spec.ts`.

## Routing topology

```
┌─────────────────────────┐       ┌─────────────────────────┐
│ Browser (Vite dev, 5173)│       │ Browser (prod build)    │
│   fetch("/api/convert/")│       │   KendrawApiClient with │
│   fetch("/api/health")  │       │   baseUrl=http://…:8081 │
└──────────┬──────────────┘       └──────────┬──────────────┘
           │                                 │
           │   Vite proxy                    │   direct (CORS on backend)
           │   rewrite: ^/api → ""           │
           ▼                                 ▼
┌─────────────────────────────────────────────────────────┐
│ FastAPI — uvicorn on 0.0.0.0:8081                       │
│   routers (main.py):                                    │
│     health  (no prefix)                                 │
│     compute (prefix=/compute)                           │
│     convert (prefix=/convert)                           │
│     nmr     (prefix=/compute)                           │
└─────────────────────────────────────────────────────────┘
```

**Rule:** All browser-side calls use `/api/...` relative paths. The Vite dev
server strips `/api` and forwards to port 8081. In production the built client
would need `VITE_API_BASE_URL` wired through the same rewrite (not yet
implemented — tracked separately).

Backend routers never carry a `/v1` or `/api` prefix. If you ever see `/v1/`
in a frontend call, it is a regression.

## Endpoint catalogue

| Method | Backend path                     | Router file                                  | Frontend caller(s)                                       | Purpose                                      |
| ------ | -------------------------------- | -------------------------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| GET    | `/health`                        | `backend/kendraw_api/routers/health.py:25`   | `packages/ui/src/hooks/useBackendAvailability.ts:13`, `packages/api-client/src/index.ts:102` | Liveness + NMR feature flag                  |
| GET    | `/version`                       | `backend/kendraw_api/routers/health.py:41`   | _(not called from frontend; used by CI/ops)_             | Build version + git sha                      |
| POST   | `/convert/`                      | `backend/kendraw_api/routers/convert.py:17`  | `packages/ui/src/PropertyPanel.tsx:52`, `packages/api-client/src/index.ts:70` | SMILES ↔ MOL conversion                      |
| POST   | `/compute/properties/smiles`     | `backend/kendraw_api/routers/compute.py:19`  | `packages/ui/src/PropertyPanel.tsx:60`, `packages/api-client/src/index.ts:56` | Descriptors (MW, LogP, tPSA, HBD/HBA, etc.) |
| POST   | `/compute/properties/mol`        | `backend/kendraw_api/routers/compute.py:27`  | _(not called from frontend yet — reserved for MOL-only molecules)_ | Descriptors from MOL block                  |
| POST   | `/compute/nmr`                   | `backend/kendraw_api/routers/nmr.py:22`      | `packages/nmr/src/NmrPanel.tsx` via `packages/api-client/src/index.ts:89` | Predicted 1H/13C NMR peaks + confidence     |

## Known tech debt (not a bug)

1. **`KendrawApiClient` default baseUrl is hardcoded** to `http://localhost:8081`
   (see `packages/api-client/src/index.ts:53`). Works in dev; production must
   construct the client with `new KendrawApiClient('/api')` to go through the
   same proxy path as `PropertyPanel`. See observation #609 (Apr 14) for prior
   analysis.

2. **`useBackendAvailability` also defaults to `http://localhost:8081`**. Same
   caveat as above.

3. **Convert endpoint has a trailing slash** (`/convert/`). FastAPI would
   redirect `/convert` → `/convert/` (307) but the browser would not re-send
   the POST body. Always keep the trailing slash on the frontend side.

## Contract tests protecting this map

- `e2e/regression/bug-api-v1-prefix-404.spec.ts` — asserts zero 4xx on
  `/api/*`, zero `/v1/` calls leave the frontend, and the two descriptor
  endpoints resolve end-to-end.
- `e2e/p0-smoke/backend-api-contract.spec.ts` — smoke tests `/health`,
  `/compute/properties/smiles`, `/compute/nmr`.
- Backend-side: `backend/tests/test_api_endpoints.py` exercises each router
  directly via FastAPI `TestClient`.

## Changing the API

1. Add the route in the correct router file (match the router's `prefix=` — do
   not hardcode the prefix into the path).
2. Add a test in `backend/tests/test_<module>.py`.
3. Add the frontend caller using the relative `/api/...` path (never a full
   URL).
4. Update this table.
5. Add a regression test in `e2e/regression/` if the endpoint is load-bearing
   for a user journey.
