from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
from pathlib import Path

# Load environment from .env files early so service init sees them
try:
    from dotenv import load_dotenv  # type: ignore
    # backend/.env
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=False)
    # repo root .env
    load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)
except Exception:
    pass

rag_service = None
_init_error: str | None = None
try:  # Preferred: package-relative import when started as backend.app
    from .hype_rag import rag_service as _rs  # type: ignore
    rag_service = _rs
except Exception as e1:  # pragma: no cover
    try:
        # Fallback: absolute import if working dir adds parent on sys.path
        from backend.hype_rag import rag_service as _rs2  # type: ignore
        rag_service = _rs2
    except Exception as e2:
        try:
            # Last resort: construct a fresh instance to keep service usable
            from backend.hype_rag import RAGService  # type: ignore
            rag_service = RAGService()
        except Exception as e3:
            _init_error = f"import_failed: {e1.__class__.__name__}: {e1}; abs_failed: {e2.__class__.__name__}: {e2}; ctor_failed: {e3.__class__.__name__}: {e3}"

app = FastAPI(title="IOMP Core RAG Service", version="0.1.0")

cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "*")
if cors_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # configurable via CORS_ALLOW_ORIGINS env var
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup_preload():
    """Optionally preload the embedding model to avoid first-request latency.
    Controlled by FORCE_EMBED_PRELOAD=1 and USE_EMBEDDINGS!=0.
    """
    try:
        if rag_service is None:
            return
        if os.getenv("FORCE_EMBED_PRELOAD", "0") not in ("1", "true", "True"):
            return
        if os.getenv("USE_EMBEDDINGS", "1") in ("0", "false", "False"):
            return
        # Trigger model construction and a tiny warmup encode
        model = getattr(rag_service, "_get_model", None)
        if callable(model):
            m = model()
            if m is not None:
                try:
                    m.encode(["warm up"], batch_size=1, convert_to_numpy=True, normalize_embeddings=True)
                except Exception:
                    pass
    except Exception:
        # Preload is best-effort; ignore failures
        pass


@app.get("/health")
def health():
    return {"status": "ok", "phase": "stage-2"}


class AskRequest(BaseModel):
    question: str
    k: int = 5
    user_id: str = "default"
    mmr: Optional[bool] = None
    low_memory: Optional[bool] = None
    max_chars: Optional[int] = None


def _project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _data_dir() -> str:
    """Resolve writable data directory. Prefer DATA_DIR env, fallback to repo-root/data."""
    env_dir = os.getenv("DATA_DIR")
    path = env_dir if env_dir else os.path.join(_project_root(), "data")
    os.makedirs(path, exist_ok=True)
    return path


def _log_event(event: str, data: dict) -> None:
    """Minimal JSONL logger to data/log.txt; errors are ignored."""
    try:
        log_path = os.path.join(_data_dir(), "log.txt")
        rec = {"ts": datetime.utcnow().isoformat() + "Z", "event": event, **data}
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:
        pass


@app.post("/upload")
def upload_files(
    user_id: str = Form("default"),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    files: List[UploadFile] = File(...),
):
    """Accept one or more files, save to a temp folder, and build an index from them."""
    if rag_service is None:
        raise HTTPException(status_code=500, detail="rag_service not initialized")
    import tempfile, shutil
    try:
        with tempfile.TemporaryDirectory(prefix="rag_upload_") as tmpdir:
            names = []
            for f in files:
                dest = os.path.join(tmpdir, f.filename)
                with open(dest, "wb") as out:
                    shutil.copyfileobj(f.file, out)
                names.append(f.filename)
            docs, chunks, index_name = rag_service.build_index_from_folder(
                tmpdir, chunk_size, chunk_overlap, name_prefix="upload", user_id=user_id
            )
            payload = {
                "status": "built",
                "documents": docs,
                "chunks": chunks,
                "index_name": index_name,
                "mongo_stats": getattr(rag_service, "last_build_stats", {}),
            }
            # Reflect actual persisted location for IOMP backend
            try:
                from pathlib import Path as _P
                data_dir = os.getenv("DATA_DIR") or os.path.join(_project_root(), "data")
                idx_dir = _P(data_dir) / "indices" / user_id / index_name
                payload["index_dir"] = str(idx_dir)
            except Exception:
                payload["index_dir"] = None
            _log_event("upload_build", {"files": names, **payload})
            return payload
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ask")
def ask(req: AskRequest):
    if rag_service is None:
        raise HTTPException(status_code=500, detail="rag_service not initialized")
    try:
        # transient overrides via query body
        if req.low_memory is not None:
            os.environ["LOW_MEMORY_MODE"] = "1" if req.low_memory else "0"
        if req.mmr is not None:
            os.environ["MMR_ENABLED"] = "1" if req.mmr else "0"
        if req.max_chars is not None and req.max_chars > 0:
            os.environ["ANSWER_MAX_CHARS"] = str(req.max_chars)
        result = rag_service.answer(req.question, req.k, user_id=req.user_id)
        short = result.copy()
        ans = short.get("answer", "")
        if isinstance(ans, str) and len(ans) > 2000:
            short["answer"] = ans[:2000] + "..."
        _log_event("ask", {"question": req.question, "k": req.k, **short})
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/config")
def config():
    try:
        if rag_service is None:
            return {"initialized": False, "error": _init_error}
        return {
            "initialized": True,
            "use_mongo_vector": bool(getattr(rag_service, "use_mongo_vector", False)),
            "embedding_model": getattr(getattr(rag_service, "embeddings", object()), "model_name", "unknown"),
            "embed_provider": getattr(rag_service, "embed_provider_name", "local"),
            # For per-user we no longer have a global active_index_name; expose summary instead
            "active_index_name": getattr(rag_service, "active_index_name", None),
            "multi_tenant": hasattr(rag_service, "_indices_by_user"),
            "low_memory_mode": os.getenv("LOW_MEMORY_MODE", "1"),
            "mmr_enabled": os.getenv("MMR_ENABLED", "0"),
            "answer_max_chars": os.getenv("ANSWER_MAX_CHARS", "1200"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/status")
def status(user_id: str = "default"):
    if rag_service is None:
        raise HTTPException(status_code=500, detail="rag_service not initialized")
    try:
        summary = rag_service.list_indices(user_id)
        return {
            "user_id": user_id,
            "indices": summary,
            "embedding_model": getattr(getattr(rag_service, "embeddings", object()), "model_name", "unknown"),
            "low_memory_mode": os.getenv("LOW_MEMORY_MODE", "1"),
            "mmr_enabled": os.getenv("MMR_ENABLED", "0"),
            "last_build_stats": getattr(rag_service, "last_build_stats", {}),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/index")
def delete_index(user_id: str, index_name: str):
    if rag_service is None:
        raise HTTPException(status_code=500, detail="rag_service not initialized")
    try:
        result = rag_service.delete_index(user_id, index_name)
        _log_event("delete_index", {"user_id": user_id, "index": index_name, **result})
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


