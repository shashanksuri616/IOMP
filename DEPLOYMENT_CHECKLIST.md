# Final Deployment Checklist for IOMP

This checklist summarizes the production knobs and endpoints to run the backend reliably on small instances (<= 512MB) and link the frontend.

## Backend (FastAPI)

- Start command
  - `uvicorn backend.app:app --host 0.0.0.0 --port 8000`
- Health & status
  - `GET /health` → { status: ok }
  - `GET /config` → flags (embedding_model, low_memory_mode, mmr_enabled)
  - `GET /status?user_id=default` → indices summary, last build stats
- Core endpoints
  - `POST /upload` (multipart)
    - form: user_id, chunk_size, chunk_overlap, files[]
  - `POST /ask` (json)
    - body: { question, k, user_id, mmr?, low_memory?, max_chars? }
  - `DELETE /index?user_id=...&index_name=...` → remove an index for a user

## Required environment

- CORS_ALLOW_ORIGINS: `*` or your frontend origin
- DATA_DIR: absolute path to a writable folder (default: repo `data/`)
- HF/Transformers caches are auto-redirected to `DATA_DIR/hf` to avoid `/app` permission issues.

## Low-memory defaults (safe for 512 MB)

Set as env vars on your host (platform UI) or `.env`:

- LOW_MEMORY_MODE=1
- DROP_FULL_CHUNKS=1
- RESTORE_FULL_ON_ANSWER=1
- MAX_CHUNKS_PER_INDEX=3000
- TRUNCATE_CHUNK_CHARS=300
- MAX_TOTAL_TEXT_BYTES=4000000
- KEYWORD_CANDIDATES=120
- RERANK_MAX=160
- RETRIEVAL_BLOCK=2048
- TOP_N_CANDIDATES=40
- MMR_ENABLED=1
- MMR_LAMBDA=0.5
- ANSWER_MAX_CHARS=900
- USE_EMBEDDINGS=0   # flip to 1 when you have RAM and internet to load the ST model

Notes:
- With LOW_MEMORY_MODE=1, the service uses keyword prune + hash-embedding rerank (no model download needed).
- When ready, set LOW_MEMORY_MODE=0 and USE_EMBEDDINGS=1 to enable SentenceTransformer retrieval; re-upload to rebuild embeddings.

## Persistence

- Indices per-user are stored under `DATA_DIR/indices/{user_id}/{index_name}`
  - chunks.jsonl: original full text chunks
  - emb.npy: float16 embeddings (only when embeddings enabled)
  - meta.json: model, counts, timestamps
  - active.txt: active index name for the user

## Frontend

- Set VITE_API_BASE to backend URL (or same-origin if reverse-proxy)
- Frontend includes a stable user_id in requests; no cross-user leakage.

## Security & Operations

- Limit upload size on your host (platform) if needed
- Back up DATA_DIR for durability
- Monitor logs: `data/log.txt`
- Consider adding basic auth or a token gateway if exposed publicly

## Troubleshooting

- Model download/caching errors: ensured caches go to `DATA_DIR/hf`
- OOM during upload: lower `MAX_CHUNKS_PER_INDEX`, `TRUNCATE_CHUNK_CHARS`, `MAX_TOTAL_TEXT_BYTES`, or set `USE_EMBEDDINGS=0`
- Poor answers: enable embeddings (USE_EMBEDDINGS=1, LOW_MEMORY_MODE=0) or increase `KEYWORD_CANDIDATES`, `RERANK_MAX`
