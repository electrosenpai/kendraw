# Deployment Guide — Kendraw v0.1.0

## Self-Hosted (Docker)

The recommended deployment method:

```bash
git clone https://github.com/electrosenpai/kendraw.git
cd kendraw/docker
docker compose up -d
```

### Environment Variables

| Variable              | Default | Description       |
| --------------------- | ------- | ----------------- |
| KENDRAW_FRONTEND_PORT | 8080    | Frontend port     |
| KENDRAW_BACKEND_PORT  | 8081    | Backend API port  |
| KENDRAW_LOG_LEVEL     | info    | Backend log level |
| GIT_COMMIT            | unknown | Build commit hash |

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name kendraw.example.com;

    location / {
        proxy_pass http://localhost:8080;
    }

    location /api/ {
        proxy_pass http://localhost:8081/;
    }
}
```

## Static Demo (GitHub Pages)

Build a frontend-only bundle without backend dependency:

```bash
pnpm build
# Deploy dist/ to any static hosting
```

The app detects backend availability and shows "Static demo mode" when the backend is unreachable.

## Production Checklist

- [ ] Configure HTTPS
- [ ] Set security headers (CSP, X-Frame-Options)
- [ ] Set GIT_COMMIT build arg for traceability
- [ ] Configure log level (warn for prod)
- [ ] Set up monitoring (optional: Grafana/Prometheus)
