# HyPE RAG – React Frontend

A modern React (Vite + TypeScript + Tailwind) UI for your RAG backend running at http://localhost:8000.

## Prerequisites
- Node.js 18+ (recommended 18 or 20)
- Backend running locally at http://localhost:8000 (FastAPI). You can verify with: http://localhost:8000/config

## Quick start (Windows cmd)

```cmd
cd /d f:\clg\Projects\IOMP\RAG_Techniques\frontend\app
copy .env.example .env
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build for production
```cmd
cd /d f:\clg\Projects\IOMP\RAG_Techniques\frontend\app
npm run build
npm run preview
```

This serves the built app locally (defaults to http://localhost:4173). You can also configure your FastAPI app to serve the `dist/` folder as static files if you prefer a single-server setup.

## App structure
- `src/components/Header.tsx` – shows backend mode and active index
- `src/components/UploadPanel.tsx` – upload docs and build index
- `src/components/WebBuildPanel.tsx` – build index from the web (Reddit-friendly, forum options)
- `src/components/AskPanel.tsx` – ask questions against the active index
- `src/lib/api.ts` – typed API client; base URL comes from `VITE_API_BASE` or defaults to `http://localhost:8000`

## Environment
- `.env.example` contains `VITE_API_BASE=http://localhost:8000`
- Copy to `.env` and adjust if your backend runs elsewhere

## Common issues
- If the page cannot reach the backend, ensure FastAPI is running and CORS is enabled for http://localhost:5173.
- If imports like `@/lib/api` fail, ensure you start via `npm run dev` or that your build succeeds (Vite alias is configured in `vite.config.ts`).

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – build production bundle
- `npm run preview` – serve the production build locally

```