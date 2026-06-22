# syntax=docker/dockerfile:1
# ─── PyRIT attack server (FastAPI) ───────────────────────────────

FROM python:3.11-slim-bookworm AS base
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Upgrade pip first (the base image's pip has known CVEs) then install deps.
COPY requirements.txt ./
RUN python -m pip install --upgrade "pip>=26.1.2" \
    && pip install -r requirements.txt

COPY server.py defense.py ./

# Run unprivileged; give it a writable results directory.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/results \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)"

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
