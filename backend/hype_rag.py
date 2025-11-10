"""Stage 1: Minimal, self-contained RAG service for IOMP (upload-only core).

This file intentionally avoids any web-build, forum, Mongo, or advanced logic.
It is designed to evolve over several commits, mirroring a real development flow.

Notes for readers:
- The original full implementation lives in another project ("Major").
- Duplication here is deliberate to keep IOMP independent and simple.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple, Optional
import os
import time
import os
import numpy as np
import json
from pathlib import Path

from .helper_functions import read_text_from_file, split_into_chunks


@dataclass
class EmbeddingsInfo:
    model_name: str = "stub-local"


class RAGService:
    def __init__(self) -> None:
        # minimal state
        self.embeddings = EmbeddingsInfo()
        self.use_mongo_vector = False
        # Per-user multi-tenant storage
        # _indices_by_user[user_id] = { 'active': str|None, 'indices': { index_name: { 'chunks': List[dict], 'emb': np.ndarray } } }
        self._indices_by_user: Dict[str, Dict[str, Any]] = {}
        self.last_build_stats: Dict[str, Any] = {}
        self._model = None
        # on boot, try load any persisted indices
        try:
            self._load_from_disk()
        except Exception:
            # non-fatal; continue with empty in-memory state
            pass

    # ---- Persistence helpers ----
    def _data_dir(self) -> Path:
        base = os.getenv("DATA_DIR")
        if base:
            p = Path(base)
        else:
            # repo root two levels up from this file
            p = Path(__file__).resolve().parents[2] / "data"
        p.mkdir(parents=True, exist_ok=True)
        return p

    def _user_dir(self, user_id: str) -> Path:
        p = self._data_dir() / "indices" / user_id
        p.mkdir(parents=True, exist_ok=True)
        return p

    def _index_dir(self, user_id: str, index_name: str) -> Path:
        p = self._user_dir(user_id) / index_name
        p.mkdir(parents=True, exist_ok=True)
        return p

    def _persist_index(self, user_id: str, index_name: str, chunks: List[Dict[str, Any]], emb: Optional[np.ndarray]) -> Optional[Path]:
        idx_dir = self._index_dir(user_id, index_name)
        # chunks.jsonl
        with (idx_dir / "chunks.jsonl").open("w", encoding="utf-8") as f:
            for ch in chunks:
                f.write(json.dumps(ch, ensure_ascii=False) + "\n")
        # embedding matrix
        emb_path: Optional[Path] = None
        if emb is not None:
            emb_path = idx_dir / "emb.npy"
            np.save(emb_path, emb)
        # metadata
        meta = {
            "model": self.embeddings.model_name,
            "created_ts": int(time.time()),
            "chunks": len(chunks),
            "has_emb": emb is not None,
        }
        with (idx_dir / "meta.json").open("w", encoding="utf-8") as f:
            json.dump(meta, f)

        # mark active
        with (self._user_dir(user_id) / "active.txt").open("w", encoding="utf-8") as f:
            f.write(index_name)
        return emb_path

    def _load_from_disk(self) -> None:
        base = self._data_dir() / "indices"
        if not base.exists():
            return
        for user_dir in base.iterdir():
            if not user_dir.is_dir():
                continue
            user_id = user_dir.name
            slot = self._ensure_user_slot(user_id)
            # read active
            active = None
            atxt = user_dir / "active.txt"
            if atxt.exists():
                try:
                    active = atxt.read_text(encoding="utf-8").strip() or None
                except Exception:
                    active = None
            # load indices
            for idx_dir in user_dir.iterdir():
                if not idx_dir.is_dir():
                    continue
                name = idx_dir.name
                chunks_path = idx_dir / "chunks.jsonl"
                if not chunks_path.exists():
                    continue
                chunks: List[Dict[str, Any]] = []
                try:
                    with chunks_path.open("r", encoding="utf-8") as f:
                        for line in f:
                            try:
                                chunks.append(json.loads(line))
                            except Exception:
                                continue
                except Exception:
                    continue
                emb_path = idx_dir / "emb.npy"
                # Do NOT load embeddings into RAM on boot; store path only
                if emb_path.exists():
                    slot["indices"][name] = {"chunks": chunks, "emb_path": str(emb_path)}
                else:
                    slot["indices"][name] = {"chunks": chunks, "emb_path": None}
            slot["active"] = active

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                if os.getenv("USE_EMBEDDINGS", "1") in ("0", "false", "False"):
                    self._model = None
                    return None
                model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
                # Honor cache dirs to reduce memory thrash on small instances
                for k in ["HF_HOME", "TRANSFORMERS_CACHE", "SENTENCE_TRANSFORMERS_HOME"]:
                    os.environ.setdefault(k, os.getenv(k, "/app/data/hf"))
                self._model = SentenceTransformer(model_name)
                self.embeddings.model_name = model_name
            except Exception:
                # fallback: no model, keep None; we'll degrade to keyword matching
                self._model = None
        return self._model

    def _ensure_user_slot(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._indices_by_user:
            self._indices_by_user[user_id] = {"active": None, "indices": {}}
        return self._indices_by_user[user_id]

    # --- Build (upload-only) ---
    def build_index_from_folder(
        self,
        folder_path: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        name_prefix: str = "upload",
        user_id: str = "default",
    ) -> Tuple[int, int, str]:
        """Naive folder ingestion: reads .txt/.md/.csv as text and chunks them.
        Returns (documents_count, chunks_count, index_name).
        """
        docs: List[Tuple[str, str]] = []  # (path, text)
        for root, _dirs, files in os.walk(folder_path):
            for fn in files:
                ext = os.path.splitext(fn.lower())[1]
                if ext in (".txt", ".md", ".csv", ".pdf"):
                    p = os.path.join(root, fn)
                    try:
                        txt = read_text_from_file(p)
                        if txt.strip():
                            docs.append((p, txt))
                    except Exception:
                        # skip unreadable files
                        continue

        # chunk
        all_chunks: List[Dict[str, Any]] = []
        for p, txt in docs:
            for i, ch in enumerate(split_into_chunks(txt, chunk_size, chunk_overlap)):
                all_chunks.append({
                    "text": ch,
                    "source": p.replace("\\", "/"),
                    "chunk_id": i,
                })

        # Optional cap to keep memory within limits
        try:
            max_chunks = int(os.getenv("MAX_CHUNKS_PER_INDEX", "20000"))
        except Exception:
            max_chunks = 20000
        if len(all_chunks) > max_chunks:
            all_chunks = all_chunks[:max_chunks]

        # Compute embeddings if model available
        emb = None
        model = self._get_model()
        if model is not None and all_chunks:
            try:
                texts = [c["text"] for c in all_chunks]
                bsz = int(os.getenv("EMB_BATCH", os.getenv("EMB_RETRIEVAL_BATCH", "32")))
                emb = model.encode(texts, batch_size=bsz, convert_to_numpy=True, normalize_embeddings=True)
            except Exception:
                emb = None
                # smaller batch to reduce memory; configurable via EMB_BATCH
                try:
                    bsz = int(os.getenv("EMB_BATCH", "8"))
                except Exception:
                    bsz = 8
                # Encode in batches to limit peak memory
                vecs: List[np.ndarray] = []
                for i in range(0, len(texts), bsz):
                    part = model.encode(texts[i:i+bsz], batch_size=bsz, convert_to_numpy=True, normalize_embeddings=True)
                    vecs.append(part)
                emb = np.vstack(vecs) if vecs else None
                # Downcast to float16 to conserve RAM/disk
        # Downcast to float16 to conserve RAM/disk
        if emb is not None:
            emb = emb.astype(np.float16)
        index_name = f"{name_prefix}-{int(time.time())}"
        slot = self._ensure_user_slot(user_id)
        # Store chunks in memory; embeddings go to disk to avoid RAM usage
        slot["indices"][index_name] = {"chunks": all_chunks, "emb_path": None}
        slot["active"] = index_name if all_chunks else None
        # persist to disk for durability
        try:
            emb_path = self._persist_index(user_id, index_name, all_chunks, emb)
            # save path reference so answer() can memmap lazily
            slot["indices"][index_name]["emb_path"] = str(emb_path) if emb_path else None
        except Exception:
            # non-fatal persistence error
            pass
        self.last_build_stats = {
            "backend": "faiss-stub",
            "attempted": len(all_chunks),
            "inserted": len(all_chunks),
            "empty_index": len(all_chunks) == 0,
        }
        return (len(docs), len(all_chunks), index_name)

    # --- Ask (very naive) ---
    def answer(self, question: str, k: int = 5, user_id: str = "default") -> Dict[str, Any]:
        """Answer using embedding similarity with memory-safe scanning, MMR, and extractive synthesis.
        Falls back to keyword matching when embeddings are unavailable.
        """
        slot = self._ensure_user_slot(user_id)
        active = slot.get("active")
        if not active:
            return {"answer": "", "sources": [], "error": "No active index (empty or not built). Upload a supported file: .txt .md .csv .pdf"}
        idx = slot["indices"].get(active)
        if not idx:
            return {"answer": "", "sources": [], "error": "Index is empty."}
        chunks = idx["chunks"]
        emb = None
        emb_path = idx.get("emb_path")
        if emb_path:
            try:
                emb = np.load(emb_path, mmap_mode="r")  # memory-map; minimal RAM
            except Exception:
                emb = None

        # Try embedding flow first
        if emb is not None and len(chunks) == emb.shape[0]:
            model = self._get_model()
            if model is not None:
                try:
                    qv = model.encode([question], convert_to_numpy=True, normalize_embeddings=True)[0].astype(np.float16)
                    # Streamed dot-product to constrain RAM
                    try:
                        block = int(os.getenv("RETRIEVAL_BLOCK", "4096"))
                    except Exception:
                        block = 4096
                    scores_list: List[np.ndarray] = []
                    n = emb.shape[0]
                    for i in range(0, n, block):
                        blk = emb[i:i+block]
                        scores_list.append(np.dot(blk, qv))
                    scores = np.concatenate(scores_list) if scores_list else np.empty((0,), dtype=np.float32)

                    # Candidate pruning
                    try:
                        top_n = int(os.getenv("TOP_N_CANDIDATES", str(max(20, k*8))))
                    except Exception:
                        top_n = max(20, k*8)
                    cand_idx = np.argsort(-scores)[: max(k, top_n)]

                    # Optional MMR diversification
                    mmr_enabled = os.getenv("MMR_ENABLED", "0") in ("1", "true", "True")
                    if mmr_enabled:
                        try:
                            lam = float(os.getenv("MMR_LAMBDA", "0.5"))
                        except Exception:
                            lam = 0.5
                        selected: List[int] = []
                        cand = cand_idx.tolist()
                        # Precompute normalized reps for similarity among candidates if needed
                        # emb already normalized; use dot for cosine
                        for _ in range(min(k, len(cand))):
                            best_j = None
                            best_score = -1e9
                            for j in cand:
                                rel = scores[j]
                                div = 0.0
                                if selected:
                                    # max similarity to already selected
                                    sims = [float(np.dot(emb[j], emb[s])) for s in selected]
                                    div = max(sims) if sims else 0.0
                                mmr = lam * float(rel) - (1.0 - lam) * div
                                if mmr > best_score:
                                    best_score = mmr
                                    best_j = j
                            if best_j is None:
                                break
                            selected.append(best_j)
                            cand.remove(best_j)
                        top_idx = np.array(selected, dtype=int)
                    else:
                        top_idx = cand_idx[:k]

                    top = [chunks[int(i)] for i in top_idx]
                except Exception:
                    top = chunks[: max(1, k)]
            else:
                top = chunks[: max(1, k)]
        else:
            # Fallback keyword matching
            q_terms = {t.lower() for t in question.split() if t.strip()}
            scored: List[Tuple[int, Dict[str, Any]]] = []
            for ch in chunks:
                text = ch.get("text", "").lower()
                score = sum(1 for t in q_terms if t in text)
                scored.append((score, ch))
            scored.sort(key=lambda x: x[0], reverse=True)
            top = [c for _s, c in scored[: max(1, k)]]

        # Extractive synthesis: pick best sentences from top chunks
        answer = self._synthesize_answer(question, top)
        sources = [
            {
                "source": ch.get("source"),
                "chunk_id": ch.get("chunk_id"),
                "preview": ch.get("text", "")[:120],
            }
            for ch in top
        ]
        return {"answer": answer, "sources": sources}

    # ---- Simple extractive synthesis to improve readability without LLM ----
    def _synthesize_answer(self, question: str, top_chunks: List[Dict[str, Any]]) -> str:
        try:
            max_chars = int(os.getenv("ANSWER_MAX_CHARS", "1200"))
        except Exception:
            max_chars = 1200
        q_terms = [t.lower() for t in question.split() if t.strip()]
        sentences: List[Tuple[float, str]] = []
        for ch in top_chunks:
            text = ch.get("text", "")
            # naive sentence split
            for sent in text.split(". "):
                s_clean = sent.strip()
                if not s_clean:
                    continue
                s_low = s_clean.lower()
                # score by term overlap and length penalty
                overlap = sum(1 for t in q_terms if t in s_low)
                score = overlap - 0.001 * max(0, len(s_clean) - 300)
                if overlap > 0:
                    sentences.append((score, s_clean))
        if not sentences:
            # fallback: join first lines of chunks
            raw = "\n\n".join(ch.get("text", "")[:300] for ch in top_chunks)
            return raw[:max_chars]
        sentences.sort(key=lambda x: x[0], reverse=True)
        out_lines: List[str] = []
        used: set[str] = set()
        for _score, s in sentences:
            if s in used:
                continue
            used.add(s)
            out_lines.append(s if s.endswith('.') else s + '.')
            if sum(len(x) + 1 for x in out_lines) >= max_chars:
                break
        return " \n".join(out_lines)[:max_chars]


# singleton as in original project style
rag = RAGService()
rag_service = rag  # keep the same name used by app.py

# NOTE: Simplified: removed external dependency on service.hype_rag so this
# module is self-contained. The earlier version attempted to import the full
# implementation; that caused initialization failures in hosted environments
# where the parent 'service' package was absent. Now we always use the minimal
# built-in RAGService above. If you later want a richer implementation, replace
# the class definition rather than importing externally.
