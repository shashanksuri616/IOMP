# syntax=docker/dockerfile:1
# IOMP FastAPI backend

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LOW_MEMORY_MODE=1 \
    USE_EMBEDDINGS=0 \
    DROP_FULL_CHUNKS=1 \
    RESTORE_FULL_ON_ANSWER=1 \
    MAX_CHUNKS_PER_INDEX=3000 \
    TRUNCATE_CHUNK_CHARS=300 \
    MAX_TOTAL_TEXT_BYTES=4000000 \
    ANSWER_MAX_CHARS=900

WORKDIR /app

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

# Python deps
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

# App code
COPY . /app/backend
RUN chown -R appuser:appuser /app

# Expose data dir for indices/logs created by app.py (_project_root()/data)
RUN mkdir -p /app/data && chown appuser:appuser /app/data
VOLUME ["/app/data"]

EXPOSE 8000

# Healthcheck (container must have curl installed above)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# Start the FastAPI app
USER appuser

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
