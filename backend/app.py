from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# rag_service will be wired in a later commit once hype_rag.py is trimmed.
try:  # Attempt relative import first
    from .hype_rag import rag_service  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    rag_service = None  # placeholder; actual service comes later

app = FastAPI(title="IOMP Core RAG Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later: restrict via env var
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "phase": "stage-1"}


class AskRequest(BaseModel):
    question: str
    k: int = 5


@app.post("/upload")
def upload_files(chunk_size: int = 1000, chunk_overlap: int = 200, files: List[UploadFile] = File(...)):
    """Stage 1 placeholder: real implementation added in a later commit."""
    raise HTTPException(status_code=501, detail="/upload not implemented yet in stage 1")


@app.post("/ask")
def ask(req: AskRequest):
    """Stage 1 placeholder: will call rag_service.answer once wired."""
    raise HTTPException(status_code=501, detail="/ask not implemented yet in stage 1")


