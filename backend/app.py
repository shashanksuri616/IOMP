from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import json
from datetime import datetime

# rag_service will be wired in a later commit once hype_rag.py is trimmed.
try:  # Attempt relative import first
    from .hype_rag import rag_service  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    rag_service = None  # placeholder; actual service comes later

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


@app.get("/health")
def health():
    return {"status": "ok", "phase": "stage-2"}


class AskRequest(BaseModel):
    question: str
    k: int = 5
    user_id: str = "default"


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
            payload["index_dir"] = f"faiss_hype_index_groq/{index_name}"
            _log_event("upload_build", {"files": names, **payload})
            return payload
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ask")
def ask(req: AskRequest):
    if rag_service is None:
        raise HTTPException(status_code=500, detail="rag_service not initialized")
    try:
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
            return {"initialized": False}
        return {
            "initialized": True,
            "use_mongo_vector": bool(getattr(rag_service, "use_mongo_vector", False)),
            "embedding_model": getattr(getattr(rag_service, "embeddings", object()), "model_name", "unknown"),
            "active_index_name": getattr(rag_service, "active_index_name", None),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


