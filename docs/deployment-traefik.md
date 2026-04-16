# Kendraw production deployment — Traefik + Let's Encrypt

_Last updated: 2026-04-16._

Kendraw is deployed as **two independent Docker Compose stacks** that share a
single bridge network (`kendraw-net`). The base stack runs the frontend +
backend and is the exact same compose used for local dev. A second stack adds
Traefik in front, terminates TLS via Let's Encrypt, and routes
`kendraw.fdp.expert` to the frontend container. The two files have no import-time dependency: you
can run the base alone locally with port 8080 exposed, and bring Traefik up
on the production host without modifying anything in the base compose.

## Server coordinates

| Record    | Value                         |
| --------- | ----------------------------- |
| Hostname  | `kendraw.fdp.expert`          |
| IPv4 (A)  | `51.77.216.170`               |
| IPv6 (AAAA) | `2001:41d0:303:96aa::1`     |

## One-time setup

### 1. DNS

Create two records at your registrar. Let's Encrypt will not issue a cert
until these resolve:

```
A     kendraw.fdp.expert    51.77.216.170
AAAA  kendraw.fdp.expert    2001:41d0:303:96aa::1
```

Check:

```bash
dig +short kendraw.fdp.expert A
dig +short kendraw.fdp.expert AAAA
```

### 2. Firewall

UFW rules added on 2026-04-16 during initial setup:

```
80/tcp   ALLOW  HTTP - Traefik (kendraw)    # used for redirect + ACME HTTP-01
443/tcp  ALLOW  HTTPS - Traefik (kendraw)
```

No changes were made to the SSH (22/tcp) or Minecraft (25565/25566/24454/24455/8090) rules. Verify at any time with:

```bash
sudo ufw status verbose
```

### 3. Environment

Optional override file — defaults are sane:

```bash
cp .env.traefik.example .env.traefik
# edit if you want a different ACME contact email or domain
```

If you don't create `.env.traefik`, Compose uses `kendraw.fdp.expert` +
`jbdpetracco@gmail.com` (hardcoded defaults in the compose files).

### 4. ACME storage

Already created at `docker/letsencrypt/` with mode `700`. The directory will
fill with `acme.json` (TLS private keys) on first cert issuance — **never
commit it, never chmod it to anything more permissive than 600**. The path
is in `.gitignore`.

Because Traefik runs with `cap_drop: ALL` (no `DAC_OVERRIDE`), it can't
bypass file permissions — so the directory **must be owned by the same UID
Traefik runs as** (root, uid 0 in the official `traefik:v3.2` image).
Chown once:

```bash
sudo chown -R 0:0 docker/letsencrypt
sudo chmod 700 docker/letsencrypt
```

After this, only `root` on the host can read `acme.json` (use `sudo ls -la
docker/letsencrypt` to inspect it). This is the correct posture — the file
holds your TLS private keys.

## Deployment

### Bring up the application stack

```bash
cd /home/debian/kendraw
docker compose -f docker/docker-compose.yml up -d --build
```

This builds the frontend + backend images and creates the `kendraw-net`
network. The frontend remains reachable on the host at `http://localhost:8080`
(useful for a quick smoke test before TLS). UFW keeps that port from being
reachable publicly.

### Bring up Traefik

```bash
# Source the overrides if you made a .env.traefik:
set -a; [ -f .env.traefik ] && . .env.traefik; set +a

docker compose -f docker/docker-compose.traefik.yml up -d
```

Traefik joins the existing `kendraw-net`, discovers the `frontend` container
via the Docker provider, and starts the HTTP-01 challenge dance with Let's
Encrypt. First cert issuance usually takes under 60 seconds.

### Verify

```bash
# 1. Traefik healthy
docker ps --filter name=traefik --format '{{.Status}}'

# 2. Cert issued (file should exist and be ~5 KB)
sudo ls -la docker/letsencrypt/acme.json

# 3. HTTP redirects to HTTPS
curl -sI http://kendraw.fdp.expert | grep -i location
# → Location: https://kendraw.fdp.expert/

# 4. TLS works and serves the app
curl -sI https://kendraw.fdp.expert | head -5
# → HTTP/2 200 ...

# 5. SSL Labs grade (external, optional)
# https://www.ssllabs.com/ssltest/analyze.html?d=kendraw.fdp.expert
```

## Day-2 operations

### Renew certs

Automatic. Traefik renews 30 days before expiry via the same HTTP-01 flow.
No cron, no systemd timer needed. Monitor via:

```bash
docker logs traefik 2>&1 | grep -i "renew\|obtain\|acme"
```

### Update the app

```bash
cd /home/debian/kendraw
git pull
docker compose -f docker/docker-compose.yml up -d --build
```

Traefik hot-reloads the Docker provider — no need to restart it when the
frontend container is replaced; it picks up the new container automatically
from the labels.

### Update Traefik itself

```bash
docker compose -f docker/docker-compose.traefik.yml pull
docker compose -f docker/docker-compose.traefik.yml up -d
```

The cert state in `docker/letsencrypt/acme.json` persists across restarts.

### Tear down

```bash
# Stop Traefik (app stays up on localhost:8080)
docker compose -f docker/docker-compose.traefik.yml down

# Stop everything
docker compose -f docker/docker-compose.traefik.yml down
docker compose -f docker/docker-compose.yml down

# Full clean (drops the acme.json — you'll hit LE rate limits if you redo
# this repeatedly; use the staging server in that case, see the commented
# --caserver flag in docker-compose.traefik.yml).
docker compose -f docker/docker-compose.traefik.yml down -v
rm -rf docker/letsencrypt/acme.json
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `connection refused` on port 443 | Traefik not running, or UFW blocking | `docker ps \| grep traefik` + `sudo ufw status` |
| `404 page not found` from Traefik | Frontend container not on `kendraw-net`, or labels wrong | `docker network inspect kendraw-net` and confirm `frontend` is listed |
| Cert never issues | DNS not propagated, or port 80 unreachable from internet | `dig` the records; check UFW; try from an external host: `curl -v http://kendraw.fdp.expert/.well-known/acme-challenge/test` |
| `too many requests` in Traefik logs | Let's Encrypt rate limit (5 certs/week per domain) | Uncomment the staging `--caserver` line in `docker-compose.traefik.yml` while debugging |
| Cert works but browser shows the wrong content | Router `Host()` mismatch | Check `KENDRAW_DOMAIN` matches the DNS name exactly |
| Backend 502 through Traefik | `frontend` container can't reach `backend` | Both must be on `kendraw-net`; check `docker network inspect` |

Traefik access logs are JSON on stdout: `docker logs traefik -f | jq`.

## Security notes

- Port 8080 is still bound to the host (base compose, for local dev). In
  production UFW blocks external access, so it's only reachable as
  `127.0.0.1:8080` or from containers on the host. If you want to remove
  this attack surface entirely, comment out the `ports:` block in
  `docker/docker-compose.yml` — Traefik does not need it.
- The Traefik dashboard and API are **disabled** (`--api.dashboard=false`,
  `--api.insecure=false`). Do not re-enable without putting them behind
  basic auth or an IP allow-list.
- Docker socket is mounted read-only into the Traefik container. Traefik
  cannot create, modify, or kill containers — it only watches them.
- Containers run with `no-new-privileges`, `cap_drop: ALL`, and the backend
  additionally with a read-only filesystem (`/tmp` on tmpfs).
- `acme.json` contains your TLS private keys. Chmod 600, gitignored.
  Never copy it off the server in plaintext.
- `sniStrict: true` in the `modern` TLS profile means clients without SNI
  (extremely rare in 2026) get rejected. This stops some scanners but
  shouldn't affect real browsers.

## Why two compose files?

- **Local dev** must not need Traefik or an ACME-reachable domain. A new
  contributor runs `docker compose -f docker/docker-compose.yml up` and hits
  `http://localhost:8080`. No DNS, no certs, no port 80/443 on their laptop.
- **Production** adds Traefik as an overlay without rewriting the base.
  Rolling the Traefik stack independently from the app is useful when
  upgrading Traefik or debugging TLS.
- The two files share state through one well-known external network
  (`kendraw-net`), declared natively in the base and `external: true` in
  the Traefik compose. No magic.
