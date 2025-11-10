"""Stage 1: Minimal, self-contained RAG service for IOMP (upload-only core).

This file intentionally avoids any web-build, forum, Mongo, or advanced logic.
It is designed to evolve over several commits, mirroring a real development flow.

Notes for readers:
- The original full implementation lives in another project ("Major").
- Duplication here is deliberate to keep IOMP independent and simple.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
import os
import time

from .helper_functions import read_text_from_file, split_into_chunks


@dataclass
class EmbeddingsInfo:
    model_name: str = "stub-local"


class RAGService:
    def __init__(self) -> None:
        # minimal state
        self.embeddings = EmbeddingsInfo()
        self.use_mongo_vector = False
        self.active_index_name: str | None = None
        self._indices: Dict[str, List[Dict[str, Any]]] = {}
        self.last_build_stats: Dict[str, Any] = {}

    # --- Build (upload-only) ---
    def build_index_from_folder(
        self,
        folder_path: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        name_prefix: str = "upload",
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

        index_name = f"{name_prefix}-{int(time.time())}"
        self._indices[index_name] = all_chunks
        self.active_index_name = index_name if all_chunks else None
        self.last_build_stats = {
            "backend": "faiss-stub",
            "attempted": len(all_chunks),
            "inserted": len(all_chunks),
            "empty_index": len(all_chunks) == 0,
        }
        return (len(docs), len(all_chunks), index_name)

    # --- Ask (very naive) ---
    def answer(self, question: str, k: int = 5) -> Dict[str, Any]:
        """Extremely simple baseline: keyword match over chunks.
        This will be replaced/augmented in later commits.
        """
        if not self.active_index_name:
            return {"answer": "", "sources": [], "error": "No active index (empty or not built). Upload a supported file: .txt .md .csv .pdf"}
        chunks = self._indices.get(self.active_index_name, [])
        if not chunks:
            return {"answer": "", "sources": [], "error": "Index is empty."}

        q_terms = {t.lower() for t in question.split() if t.strip()}
        scored: List[Tuple[int, Dict[str, Any]]] = []
        for ch in chunks:
            text = ch.get("text", "").lower()
            score = sum(1 for t in q_terms if t in text)
            scored.append((score, ch))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = [c for _s, c in scored[: max(1, k)]]

        # naive "answer": concatenate top snippets
        answer = "\n\n".join(ch.get("text", "")[:300] for ch in top)
        sources = [
            {
                "source": ch.get("source"),
                "chunk_id": ch.get("chunk_id"),
                "preview": ch.get("text", "")[:120],
            }
            for ch in top
        ]
        return {"answer": answer, "sources": sources}


# singleton as in original project style
rag = RAGService()
rag_service = rag  # keep the same name used by app.py

# NOTE: Simplified: removed external dependency on service.hype_rag so this
# module is self-contained. The earlier version attempted to import the full
# implementation; that caused initialization failures in hosted environments
# where the parent 'service' package was absent. Now we always use the minimal
# built-in RAGService above. If you later want a richer implementation, replace
# the class definition rather than importing externally.
