# syntax=docker/dockerfile:1
# IOMP FastAPI backend

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# App code
COPY . /app/backend

# Expose data dir for indices/logs created by app.py (_project_root()/data)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8000

# Start the FastAPI app
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
