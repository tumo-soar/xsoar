FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS build

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0

WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY packages packages
COPY services/worker-ai services/worker-ai
RUN uv sync --frozen --no-dev --no-editable --package xsoar-worker-ai


FROM python:3.12-slim-bookworm

RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY --from=build /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

USER app
CMD ["python", "-m", "xsoar_worker_ai"]
