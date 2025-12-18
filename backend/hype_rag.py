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
from typing import cast

from .helper_functions import read_text_from_file, split_into_chunks

# Optional unified embedding provider (remote/local/hash). If EMBED_PROVIDER != 'local',
# we use embedding_provider. Kept optional to avoid import errors when file is absent.
try:
    from .embedding_provider import EmbeddingProvider  # type: ignore
except Exception:
    try:
        # fallback to project root if module placed there
        from embedding_provider import EmbeddingProvider  # type: ignore
    except Exception:
        EmbeddingProvider = None  # type: ignore


@dataclass
class EmbeddingsInfo:
    model_name: str = "stub-local"


class RAGService:
    def __init__(self) -> None:
        # minimal state
        self.embeddings = EmbeddingsInfo()
        self.embed_provider_name = os.getenv("EMBED_PROVIDER", "local").lower() #sentence-transformers/all-MiniLM-L6-v2
        self._embed_provider = None
        if self.embed_provider_name != "local" and EmbeddingProvider is not None:
            try:
                self._embed_provider = EmbeddingProvider()
                # reflect reported model
                try:
                    # prefer remote/local model name if available
                    if getattr(self._embed_provider, "remote_model_name", None):
                        self.embeddings.model_name = getattr(self._embed_provider, "remote_model_name")
                    elif getattr(self._embed_provider, "local_model_name", None):
                        self.embeddings.model_name = getattr(self._embed_provider, "local_model_name")
                    else:
                        self.embeddings.model_name = f"provider:{self.embed_provider_name}"
                except Exception:
                    self.embeddings.model_name = f"provider:{self.embed_provider_name}"
            except Exception:
                # fallback: will use hash path in _encode_texts
                self._embed_provider = None
        self.use_mongo_vector = False
        # Per-user multi-tenant storage
        # _indices_by_user[user_id] = { 'active': str|None, 'indices': { index_name: { 'chunks': List[dict], 'emb': np.ndarray } } }
        self._indices_by_user: Dict[str, Dict[str, Any]] = {}
        self.last_build_stats: Dict[str, Any] = {}
        self._model = None
        # Mongo state
        self._mongo_client = None
        self._mongo_db = None
        self._mongo_col = None
        # on boot, try load any persisted indices
        try:
            self._init_mongo_if_configured()
            if not self.use_mongo_vector:
                self._load_from_disk()
        except Exception:
            # non-fatal; continue with empty in-memory state
            pass

    # ---- HF cache prep to avoid permission errors (e.g., '/app' not writable) ----
    def _hf_cache_dir(self) -> Path:
        p = self._data_dir() / "hf"
        p.mkdir(parents=True, exist_ok=True)
        return p

    def _prepare_hf_cache_env(self) -> None:
        cache_dir = str(self._hf_cache_dir())
        for k in [
            "HF_HOME",
            "HF_HUB_CACHE",
            "HUGGINGFACE_HUB_CACHE",
            "HF_DATASETS_CACHE",
            "TRANSFORMERS_CACHE",
            "SENTENCE_TRANSFORMERS_HOME",
            "TORCH_HOME",
        ]:
            os.environ[k] = os.getenv(k, cache_dir)

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
        # If using non-local provider, don't initialize sentence-transformers
        if self.embed_provider_name != "local":
            return None
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                if os.getenv("USE_EMBEDDINGS", "1") in ("0", "false", "False"):
                    self._model = None
                    return None
                model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
                # Ensure writable HF cache before model init
                self._prepare_hf_cache_env()
                self._model = SentenceTransformer(model_name)
                self.embeddings.model_name = model_name
            except Exception:
                # fallback: no model, keep None; we'll degrade to keyword matching
                self._model = None
        return self._model

    # ---- Mongo helpers ----
    def _init_mongo_if_configured(self) -> None:
        uri = os.getenv("MONGO_URI")
        if not uri:
            self.use_mongo_vector = False
            return
        try:
            from pymongo import MongoClient
        except Exception:
            # pymongo not installed; disable mongo mode
            self.use_mongo_vector = False
            return
        self._mongo_client = MongoClient(uri)
        db_name = os.getenv("MONGO_DB", "iomp")
        # allow alternate env names used in .env
        col_name = os.getenv("MONGO_COLLECTION") or os.getenv("MONGO_VCOLL") or os.getenv("MONGO_COLL") or "chunks"
        self._mongo_db = self._mongo_client[db_name]
        self._mongo_col = self._mongo_db[col_name]
        self.use_mongo_vector = True

    def _col(self):
        if self._mongo_col is None:
            raise RuntimeError("Mongo collection not initialized; set MONGO_URI")
        return self._mongo_col

    # ---- Lightweight hash embeddings fallback when ST model unavailable ----
    def _hash_embed(self, texts: List[str], dim: int = 384) -> np.ndarray:
        import hashlib
        mat = np.zeros((len(texts), dim), dtype=np.float32)
        for i, t in enumerate(texts):
            s = t.lower()
            # word tokens
            for tok in s.split():
                h = int(hashlib.blake2b(tok.encode("utf-8"), digest_size=8).hexdigest(), 16)
                mat[i, h % dim] += 1.0
            # char bigrams
            for j in range(len(s) - 1):
                bg = s[j:j+2]
                h = int(hashlib.blake2b(bg.encode("utf-8"), digest_size=8).hexdigest(), 16)
                mat[i, h % dim] += 0.2
        # L2 normalize
        norms = np.linalg.norm(mat, axis=1, keepdims=True) + 1e-8
        mat = mat / norms
        return mat.astype(np.float16)

    def _encode_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        # Non-local provider path (remote/fast/hash via adapter)
        if self._embed_provider is not None:
            try:
                vecs = self._embed_provider.embed(texts)  # type: ignore[attr-defined]
                return vecs.astype(np.float16)
            except Exception:
                # fallback to hash
                self.embeddings.model_name = f"hash-embeddings"
                return self._hash_embed(texts)
        # Local sentence-transformers
        model = self._get_model()
        if model is None:
            # fallback hashing
            self.embeddings.model_name = "hash-embeddings"
            return self._hash_embed(texts)
        try:
            return model.encode(texts, batch_size=batch_size, convert_to_numpy=True, normalize_embeddings=True).astype(np.float16)
        except Exception:
            # as last resort, use hashing
            self.embeddings.model_name = "hash-embeddings"
            return self._hash_embed(texts)

    def _ensure_user_slot(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._indices_by_user:
            self._indices_by_user[user_id] = {"active": None, "indices": {}}
        return self._indices_by_user[user_id]

    # --- Index management helpers ---
    def list_indices(self, user_id: str) -> Dict[str, Any]:
        if self.use_mongo_vector:
            active = self._ensure_user_slot(user_id).get("active")
            try:
                col = self._col()
                names = col.distinct("index_name", {"user_id": user_id})
                out_list = []
                for nm in names:
                    cnt = col.count_documents({"user_id": user_id, "index_name": nm})
                    out_list.append({"name": nm, "chunks": int(cnt), "has_emb": True})
                return {"active": active, "indices": out_list}
            except Exception:
                return {"active": active, "indices": []}
        else:
            slot = self._ensure_user_slot(user_id)
            out = {"active": slot.get("active"), "indices": []}
            for name, meta in slot.get("indices", {}).items():
                chunks = meta.get("chunks", [])
                out["indices"].append({
                    "name": name,
                    "chunks": len(chunks),
                    "has_emb": bool(meta.get("emb_path")),
                })
            return out

    def delete_index(self, user_id: str, index_name: str) -> Dict[str, Any]:
        if self.use_mongo_vector:
            removed_disk = False
            try:
                col = self._col()
                res = col.delete_many({"user_id": user_id, "index_name": index_name})
                removed_disk = res.acknowledged
            except Exception:
                removed_disk = False
            slot = self._ensure_user_slot(user_id)
            if slot.get("active") == index_name:
                # compute remaining names
                try:
                    remaining = self._col().distinct("index_name", {"user_id": user_id})
                except Exception:
                    remaining = []
                slot["active"] = remaining[0] if remaining else None
            return {"removed_memory": True, "removed_disk": removed_disk, "active": slot.get("active")}
        else:
            slot = self._ensure_user_slot(user_id)
            existed = index_name in slot["indices"]
            # Remove from memory
            if existed:
                slot["indices"].pop(index_name, None)
            # Remove from disk
            idx_dir = self._index_dir(user_id, index_name)
            removed_disk = False
            try:
                if idx_dir.exists():
                    # cautious delete
                    for p in reversed(sorted(idx_dir.rglob("*"))):
                        try:
                            p.unlink()
                        except Exception:
                            pass
                    try:
                        idx_dir.rmdir()
                    except Exception:
                        pass
                    # if still exists, try shutil
                    if idx_dir.exists():
                        import shutil as _shutil
                        _shutil.rmtree(idx_dir, ignore_errors=True)
                    removed_disk = not idx_dir.exists()
            except Exception:
                removed_disk = False
            # Reassign active if needed
            if slot.get("active") == index_name:
                remaining = list(slot["indices"].keys())
                slot["active"] = remaining[0] if remaining else None
                try:
                    with (self._user_dir(user_id) / "active.txt").open("w", encoding="utf-8") as f:
                        f.write(slot["active"] or "")
                except Exception:
                    pass
            return {"removed_memory": existed, "removed_disk": removed_disk, "active": slot.get("active")}

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

        # chunk (build full-text chunks first)
        doc_count = len(docs)
        all_chunks: List[Dict[str, Any]] = []
        for p, txt in docs:
            for i, ch in enumerate(split_into_chunks(txt, chunk_size, chunk_overlap)):
                all_chunks.append({
                    "text": ch,
                    "source": p.replace("\\", "/"),
                    "chunk_id": i,
                })
        # Keep a deep copy of full chunks (for disk persistence and optional later restoration)
        original_full_chunks: List[Dict[str, Any]] = [dict(c) for c in all_chunks]
        # Release original docs list early to free memory
        docs = []  # type: ignore

        # Aggressive memory trimming / truncation controls
        try:
            trunc_chars = int(os.getenv("TRUNCATE_CHUNK_CHARS", "300"))
        except Exception:
            trunc_chars = 300
        if trunc_chars > 0:
            for c in all_chunks:
                txt = c.get("text", "")
                if len(txt) > trunc_chars:
                    c["text"] = txt[:trunc_chars]

        # Total text bytes cap (approx) to avoid huge RAM usage
        try:
            max_total_bytes = int(os.getenv("MAX_TOTAL_TEXT_BYTES", "4000000"))  # ~4MB default
        except Exception:
            max_total_bytes = 4000000
        running = 0
        if max_total_bytes > 0:
            trimmed: List[Dict[str, Any]] = []
            for c in all_chunks:
                t = c.get("text", "")
                running += len(t)
                if running > max_total_bytes:
                    break
                trimmed.append(c)
            if len(trimmed) < len(all_chunks):
                all_chunks = trimmed

        # Optional: drop full texts after embeddings to keep only previews
        drop_full = os.getenv("DROP_FULL_CHUNKS", "1") in ("1", "true", "True")

        # Optional cap to keep memory within limits
        try:
            max_chunks = int(os.getenv("MAX_CHUNKS_PER_INDEX", "3000"))
        except Exception:
            max_chunks = 3000
        if len(all_chunks) > max_chunks:
            all_chunks = all_chunks[:max_chunks]

        # Compute embeddings unless LOW_MEMORY_MODE enabled OR mongo without embeddings
        emb = None
        low_mem = os.getenv("LOW_MEMORY_MODE", "1") in ("1", "true", "True")
        mongo_mode = self.use_mongo_vector
        if all_chunks and not low_mem:
            texts = [c["text"] for c in all_chunks]
            try:
                bsz = int(os.getenv("EMB_BATCH", os.getenv("EMB_RETRIEVAL_BATCH", "32")))
            except Exception:
                bsz = 32
            emb = self._encode_texts(texts, batch_size=bsz)
        # Optionally drop full text (keep only preview) after embeddings to reduce memory footprint
        if drop_full:
            for c in all_chunks:
                t = c.get("text", "")
                c["text"] = t[:120]  # retain short preview only
        import gc as _gc
        _gc.collect()
        if emb is not None:
            emb = emb.astype(np.float16)
        index_name = f"{name_prefix}-{int(time.time())}"
        slot = self._ensure_user_slot(user_id)
        slot["active"] = index_name if all_chunks else None

        if mongo_mode:
            # Bulk insert into Mongo
            try:
                col = self._col()
                docs_to_insert = []
                emb_list = emb.tolist() if emb is not None else None
                for i, c in enumerate(original_full_chunks):
                    doc = {
                        "user_id": user_id,
                        "index_name": index_name,
                        "chunk_id": c.get("chunk_id"),
                        "source": c.get("source"),
                        "text": c.get("text"),
                    }
                    if emb_list is not None and i < len(emb_list):
                        doc["embedding"] = emb_list[i]
                    docs_to_insert.append(doc)
                if docs_to_insert:
                    col.insert_many(docs_to_insert)
                # store minimal meta in memory
                slot["indices"][index_name] = {"chunks": [], "emb_path": None, "mongo": True}
            except Exception:
                # fallback: treat as empty
                slot["indices"][index_name] = {"chunks": [], "emb_path": None, "mongo": True, "error": "mongo_insert_failed"}
        else:
            # Store chunks in memory; embeddings go to disk to avoid RAM usage
            slot["indices"][index_name] = {"chunks": all_chunks, "emb_path": None}
            # persist to disk for durability (store original full text, not truncated preview)
            try:
                emb_path = self._persist_index(user_id, index_name, original_full_chunks, emb)
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
        return (doc_count, len(all_chunks), index_name)

    # --- Ask (very naive) ---
    def answer(self, question: str, k: int = 5, user_id: str = "default") -> Dict[str, Any]:
        """Answer using embedding similarity with memory-safe scanning, MMR, and extractive synthesis.
        Falls back to keyword matching when embeddings are unavailable.
        """
        low_mem = os.getenv("LOW_MEMORY_MODE", "1") in ("1", "true", "True")
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
        mongo_mode = self.use_mongo_vector
        if mongo_mode:
            # Mongo-based retrieval
            try:
                col = self._col()
                # Accept both MONGO_VECTOR_INDEX and MONGO_SEARCH_INDEX
                vector_index = os.getenv("MONGO_VECTOR_INDEX") or os.getenv("MONGO_SEARCH_INDEX") or "embedding_index"
                k_req = max(1, k)
                model = self._get_model()
                # build query vector (hash fallback if model unavailable)
                if model is not None and os.getenv("USE_EMBEDDINGS", "1") not in ("0", "false", "False"):
                    qv = model.encode([question], convert_to_numpy=True, normalize_embeddings=True)[0].astype(np.float32).tolist()
                else:
                    qv = self._hash_embed([question])[0].astype(np.float32).tolist()
                try:
                    top_n = int(os.getenv("TOP_N_CANDIDATES", str(max(10, k_req*5))))
                except Exception:
                    top_n = max(10, k_req*5)
                pipeline = [
                    {"$vectorSearch": {
                        "index": vector_index,
                        "path": "embedding",
                        "queryVector": qv,
                        "numCandidates": top_n,
                        "limit": k_req,
                        "filter": {"user_id": user_id, "index_name": active},
                    }},
                    {"$project": {"text": 1, "source": 1, "chunk_id": 1, "score": {"$meta": "vectorSearchScore"}}},
                ]
                results = list(col.aggregate(pipeline))
                if not results:
                    # fallback regex/keyword prune
                    results = list(col.find({"user_id": user_id, "index_name": active}, {"text": 1, "source": 1, "chunk_id": 1}).limit(k_req))
                # Convert to expected chunk format
                top = [
                    {"text": r.get("text", ""), "source": r.get("source"), "chunk_id": r.get("chunk_id", i)}
                    for i, r in enumerate(results)
                ]
            except Exception:
                # Hard fallback to keyword matching over streaming small batches from Mongo
                try:
                    col = self._col()
                    cursor = col.find({"user_id": user_id, "index_name": active}, {"text": 1, "source": 1, "chunk_id": 1})
                    q_terms = {t.lower() for t in question.split() if t.strip()}
                    scored = []
                    for r in cursor:
                        txt = r.get("text", "").lower()
                        score = sum(1 for t in q_terms if t in txt)
                        if score > 0:
                            scored.append((score, r))
                    scored.sort(key=lambda x: x[0], reverse=True)
                    take = scored[: max(1, k)]
                    top = [
                        {"text": r.get("text", ""), "source": r.get("source"), "chunk_id": r.get("chunk_id", i)}
                        for i, (_s, r) in enumerate(take)
                    ]
                except Exception:
                    top = []
        elif emb is not None and len(chunks) == emb.shape[0]:
            model = self._get_model()
            if model is not None:
                try:
                    qv = model.encode([question], convert_to_numpy=True, normalize_embeddings=True)[0].astype(np.float16)
                    # Streamed dot-product to constrain RAM
                    try:
                        block = int(os.getenv("RETRIEVAL_BLOCK", "2048"))
                    except Exception:
                        block = 2048
                    scores_list: List[np.ndarray] = []
                    n = emb.shape[0]
                    for i in range(0, n, block):
                        blk = emb[i:i+block]
                        scores_list.append(np.dot(blk, qv))
                    scores = np.concatenate(scores_list) if scores_list else np.empty((0,), dtype=np.float32)

                    # Candidate pruning
                    try:
                        top_n = int(os.getenv("TOP_N_CANDIDATES", str(max(10, k*5))))
                    except Exception:
                        top_n = max(10, k*5)
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
                # fallback: use hash embedding for query and do dot-product
                qv = self._hash_embed([question])[0]
                try:
                    block = int(os.getenv("RETRIEVAL_BLOCK", "2048"))
                except Exception:
                    block = 2048
                scores_list: List[np.ndarray] = []
                n = emb.shape[0]
                for i in range(0, n, block):
                    blk = emb[i:i+block]
                    scores_list.append(np.dot(blk, qv))
                scores = np.concatenate(scores_list) if scores_list else np.empty((0,), dtype=np.float32)
                try:
                    top_n = int(os.getenv("TOP_N_CANDIDATES", str(max(10, k*5))))
                except Exception:
                    top_n = max(10, k*5)
                top_idx = np.argsort(-scores)[: max(k, top_n)][:k]
                top = [chunks[int(i)] for i in top_idx]
        else:
            # Low-memory two-stage retrieval: keyword prune then hash rerank
            q_terms = {t.lower() for t in question.split() if t.strip()}
            scored: List[Tuple[int, Dict[str, Any]]] = []
            for ch in chunks:
                text = ch.get("text", "").lower()
                score = sum(1 for t in q_terms if t in text)
                scored.append((score, ch))
            scored.sort(key=lambda x: x[0], reverse=True)
            try:
                cand_n = int(os.getenv("KEYWORD_CANDIDATES", "120"))
            except Exception:
                cand_n = 120
            cands = [c for _s, c in scored[: max(1, max(cand_n, k))]]
            if low_mem:
                texts = [c.get("text", "") for c in cands]
                C = len(texts)
                if C > 0:
                    C = min(C, int(os.getenv("RERANK_MAX", "160")))
                    texts = texts[:C]
                    mat = self._hash_embed(texts)
                    qv = self._hash_embed([question])[0]
                    scores = np.dot(mat, qv)
                    order = np.argsort(-scores)[:k]
                    top = [cands[int(i)] for i in order]
                else:
                    top = cands[:k]
            else:
                top = cands[:k]

        # Optional restore of full texts for answer synthesis if only previews kept
        restore_full = os.getenv("RESTORE_FULL_ON_ANSWER", "1") in ("1", "true", "True")
        if restore_full:
            # If current chunk text looks truncated (heuristic: length < 200 and DROP_FULL_CHUNKS enabled), reload originals from disk
            drop_full = os.getenv("DROP_FULL_CHUNKS", "1") in ("1", "true", "True")
            if drop_full:
                try:
                    # Load full chunk texts from persisted file
                    index_dir = Path(self._user_dir(user_id)) / active
                    chunks_path = index_dir / "chunks.jsonl"
                    if chunks_path.exists():
                        full_map: Dict[int, str] = {}
                        with chunks_path.open("r", encoding="utf-8") as f:
                            for line in f:
                                try:
                                    obj = json.loads(line)
                                    cid = obj.get("chunk_id")
                                    if isinstance(cid, int):
                                        full_map[cid] = obj.get("text", "")
                                except Exception:
                                    continue
                        for ch in top:
                            cid = ch.get("chunk_id")
                            if isinstance(cid, int) and cid in full_map:
                                ch["text"] = full_map[cid]
                except Exception:
                    pass

        # Optional LLM re-rank to improve relevance ordering
        try:
            if os.getenv("USE_LLM_RERANK", "1") in ("1", "true", "True"):
                top = self._llm_rerank_chunks(question, top, take=min(k * 2, max(3, len(top))))
        except Exception:
            pass

        # LLM synthesis with citations if Groq API available, else extractive
        use_llm = os.getenv("USE_LLM_ANSWER", "1") in ("1", "true", "True")
        if use_llm and os.getenv("GROQ_API_KEY"):
            answer_text, labeled_sources = self._llm_answer_with_citations(question, top, take=k)
        else:
            answer_text = self._synthesize_answer(question, top)
            labeled_sources = None

        sources = []
        if labeled_sources is not None:
            sources = labeled_sources
        else:
            sources = [
                {
                    "source": ch.get("source"),
                    "chunk_id": ch.get("chunk_id"),
                    "preview": ch.get("text", "")[:120],
                }
                for ch in top[:k]
            ]
        return {"answer": answer_text, "sources": sources}

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

    # ---- LLM helpers (Groq OpenAI-compatible endpoint) ----
    def _groq_chat(self, messages: List[Dict[str, str]], model: Optional[str] = None, temperature: float = 0.0, max_tokens: int = 800) -> str:
        import requests
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return ""
        endpoint = os.getenv("GROQ_CHAT_ENDPOINT", "https://api.groq.com/openai/v1/chat/completions")
        mdl = model or os.getenv("GROQ_CHAT_MODEL", os.getenv("GROQ_MODEL_ANSWER", "llama-3.1-8b-instant"))
        payload = {
            "model": mdl,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        try:
            r = requests.post(endpoint, headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
        except Exception:
            return ""

    def _llm_rerank_chunks(self, question: str, chunks: List[Dict[str, Any]], take: int) -> List[Dict[str, Any]]:
        # Build a concise list of candidates with labels
        items = []
        for i, ch in enumerate(chunks, start=1):
            txt = (ch.get("text", "") or "")
            items.append({"label": f"C{i}", "text": txt[:600], "idx": i-1})
        if not items:
            return chunks
        # Ask the LLM to rank and return top labels as JSON array
        preview = "\n\n".join([f"{it['label']}: {it['text']}" for it in items])
        sys_msg = (
            "You are a retrieval reranker. Rank snippets by relevance to the question. "
            "Return ONLY a JSON array of labels in descending relevance, no extra text."
        )
        user_msg = (
            f"Question: {question}\n\nSnippets:\n{preview}\n\n"
            f"Respond with JSON array of labels (e.g., [\"C3\",\"C1\"])."
        )
        out = self._groq_chat([
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_msg},
        ], max_tokens=200)
        order: List[int] = []
        if out:
            try:
                # Try to extract JSON array
                import json as _json
                start = out.find("[")
                end = out.rfind("]")
                if start != -1 and end != -1 and end > start:
                    arr = _json.loads(out[start:end+1])
                    labels = [str(x) for x in arr if isinstance(x, (str, int))]
                    label_to_idx = {it["label"]: it["idx"] for it in items}
                    order = [label_to_idx.get(lb) for lb in labels if label_to_idx.get(lb) is not None]
            except Exception:
                order = []
        if not order:
            return chunks[:take]
        dedup = []
        seen = set()
        for idx in order:
            if idx not in seen and 0 <= idx < len(chunks):
                dedup.append(chunks[idx])
                seen.add(idx)
            if len(dedup) >= take:
                break
        return dedup or chunks[:take]

    def _llm_answer_with_citations(self, question: str, chunks: List[Dict[str, Any]], take: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        # Label top K and construct context
        chosen = chunks[:take]
        labeled = []
        sources: List[Dict[str, Any]] = []
        # Limit total context size
        try:
            max_ctx = int(os.getenv("ANSWER_MAX_CONTEXT_CHARS", "9000"))
        except Exception:
            max_ctx = 9000
        used = 0
        parts: List[str] = []
        for i, ch in enumerate(chosen, start=1):
            label = f"[C{i}]"
            txt = ch.get("text", "")
            if not isinstance(txt, str):
                txt = str(txt)
            snippet = txt[:1500]
            block = f"{label} {snippet}"
            if used + len(block) > max_ctx and parts:
                break
            parts.append(block)
            used += len(block)
            sources.append({
                "label": label,
                "source": ch.get("source"),
                "chunk_id": ch.get("chunk_id"),
                "preview": snippet[:160],
            })
        context = "\n\n".join(parts)
        sys_msg = (
            "You are a precise, factual assistant. Use ONLY the provided context to answer. "
            "Cite sources inline with their labels like [C1]. If the answer isn't in the context, say you don't know."
        )
        user_msg = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer with citations:"
        answer = self._groq_chat([
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_msg},
        ], temperature=0.0, max_tokens=int(os.getenv("ANSWER_MAX_TOKENS", "800")))
        # Fallback to extractive if Groq failed
        if not answer:
            answer = self._synthesize_answer(question, chosen)
        return answer, sources


# singleton as in original project style
rag = RAGService()
rag_service = rag  # keep the same name used by app.py

# NOTE: Simplified: removed external dependency on service.hype_rag so this
# module is self-contained. The earlier version attempted to import the full
# implementation; that caused initialization failures in hosted environments
# where the parent 'service' package was absent. Now we always use the minimal
# built-in RAGService above. If you later want a richer implementation, replace
# the class definition rather than importing externally.
