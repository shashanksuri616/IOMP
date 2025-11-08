"""Stage 1 helper functions for IOMP core.

Focused on minimal text ingestion + chunking.
Later commits may add embedding calls, improved cleaning, and format-specific parsing.
"""
from __future__ import annotations
from typing import List

def read_text_from_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def split_into_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Simple overlapping window chunker.
    Does not perform semantic splitting (added in later stages).
    """
    if chunk_size <= 0:
        return [text]
    if chunk_overlap >= chunk_size:
        chunk_overlap = 0  # safeguard
    chunks: List[str] = []
    start = 0
    length = len(text)
    while start < length:
        end = min(length, start + chunk_size)
        chunks.append(text[start:end])
        if end == length:
            break
        start = end - chunk_overlap
        if start < 0:
            start = 0
    return chunks
