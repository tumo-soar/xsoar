FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS build

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0

WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY packages packages
COPY services/orchestrator services/orchestrator
RUN uv sync --frozen --no-dev --no-editable --package xsoar-orchestrator


FROM python:3.12-slim-bookworm

RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY services/orchestrator/alembic.ini alembic.ini
COPY services/orchestrator/migrations migrations

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

USER app
CMD ["python", "-m", "xsoar_orchestrator"]
