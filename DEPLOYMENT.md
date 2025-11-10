# IOMP – Local Deployment (Docker Compose)

This guide deploys both the FastAPI backend and the Vite React frontend from `F:\clg\Projects\IOMP\RAG_Techniques\IOMP`.

## Prerequisites
- Docker Desktop (Windows)
- Ports free: 8000 (backend), 5173 (frontend)

## One-time build and run

```cmd
cd /d F:\clg\Projects\IOMP\RAG_Techniques\IOMP

docker compose build

docker compose up -d
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Backend health: http://localhost:8000/health

To view logs:
```cmd
 docker compose logs -f backend
```

To stop:
```cmd
 docker compose down
```

## How it works
- Backend image builds from `backend/Dockerfile` and runs `uvicorn backend.app:app`.
  - Data and logs are written to `/app/data` in the container, persisted via the `backend_data` volume.
- Frontend image builds from `frontend/app/Dockerfile`, baking `VITE_API_BASE` at build time.
  - In compose, it points to `http://localhost:8000`. For multi-host or cloud, set it to your public backend URL.

## Changing API Base
If your backend runs elsewhere, rebuild the frontend with a different base:

```cmd
 docker compose build --build-arg VITE_API_BASE=http://YOUR_BACKEND_HOST:8000 frontend
 docker compose up -d
```

Alternatively, for local dev without Docker, edit `frontend/app/.env`:
```
VITE_API_BASE=http://localhost:8000
```

## Production notes
- Restrict CORS in `backend/app.py` to your frontend domain for production.
- Consider binding Nginx to 80 and putting both behind a reverse proxy (e.g., Traefik, Nginx) with TLS.
- You can mount a host folder for backend data by replacing the named volume with a path in `docker-compose.yml`:
  
```
volumes:
  - ./data:/app/data
```

## Troubleshooting
- 404s on frontend routes: confirm Nginx `nginx.conf` exists and SPA fallback is active (we included it).
- Frontend can’t reach backend: verify backend health and CORS, and confirm `VITE_API_BASE` baked at build time matches your backend URL.
- Port conflicts: change the left-hand side of the ports mapping in `docker-compose.yml`.

```
services:
  backend:
    ports: ["8080:8000"]
  frontend:
    ports: ["8081:80"]
```

---

If you need a cloud path next, I can add Render/Railway/Azure Container Apps manifests tailored to this repo.

## Cloud deployment options

| Option | Recommended Use | Pros | Considerations |
|--------|-----------------|------|----------------|
| Vercel (Frontend only) | Host the React UI | Global CDN, easy env vars, previews | Python backend with FAISS + sentence-transformers is not ideal serverless; deploy backend elsewhere |
| Render | Containerized backend + static frontend (or just backend) | Simple, auto-redeploy on push | Cold starts (free tier) |
| Railway | Backend container + persistent volume | Fast setup, env var UI | Volume persistence limits on free tier |
| Azure Container Apps | Scalable managed containers (both services) | Autoscale, logging, secure networking | Slightly more setup (az CLI / bicep) |
| Fly.io | Global placement of backend close to users | Low latency, regions | Need volume for index persistence |
| AWS ECS / Fargate | Production, flexible scaling | Mature ecosystem | More infra boilerplate |

### Deploy frontend to Vercel
1. Push your repo to GitHub.
2. In Vercel dashboard: "New Project" → import repo.
3. Root directory: `frontend/app`.
4. Framework preset: Vite.
5. Build command: `npm run build` (default). Output directory: `dist`.
6. Environment variable: set `VITE_API_BASE` to your public backend URL (e.g. `https://iomp-backend.onrender.com`).
7. Deploy. Test at the generated domain. Add a custom domain and redeploy if desired.

Backend still needs a home. Options:
- Render/Railway: create a "Web Service" pointing to repo root with Dockerfile or directly specify `backend/Dockerfile`.
- Azure Container Apps: build & push image to Azure Container Registry, then deploy container referencing `CORS_ALLOW_ORIGINS=https://your-frontend.vercel.app`.
- Fly.io: `fly launch` in `IOMP` directory, set internal port 8000, add volume if you need persistent indices.

### Container registry + generic hosting flow (backend)
```cmd
cd /d F:\clg\Projects\IOMP\RAG_Techniques\IOMP
docker build -f backend/Dockerfile -t iomp-backend:latest .
docker tag iomp-backend:latest yourregistry/iomp-backend:latest
docker push yourregistry/iomp-backend:latest
```
Then point your hosting platform (ECS task, Azure Container App revision, etc.) to `yourregistry/iomp-backend:latest` and set env vars:
```
CORS_ALLOW_ORIGINS=https://iomp.example.com,https://iomp-frontend.vercel.app
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Securing CORS
In production, never leave `CORS_ALLOW_ORIGINS=*`. Use exact domains (no trailing slashes). If you add a custom domain on Vercel, include it too.

### Persistent index data
Indices/logs live under `/app/data`. For cloud:
- Mount a volume (Render: Disk; Railway: volume plugin; Azure: persistent storage) to avoid losing FAISS indices between deployments.
- Or rebuild indices at startup (longer cold start).

### Health endpoints
- Frontend: `/__frontend_health` (Nginx) already returns JSON.
- Backend: `/health` returns status JSON used by Docker Compose healthcheck.

### Quick decision matrix
If you want the simplest split deployment today:
- Backend: Render web service (Docker) with a disk.
- Frontend: Vercel with `VITE_API_BASE` pointed at Render URL.

If you want both in one place:
- Use Azure Container Apps with two containers in one environment, or Docker Compose on a single VM behind Nginx + TLS.

Need infra-as-code examples (Azure, ECS task definition, Fly.io config)? Ask and I can scaffold them next.
