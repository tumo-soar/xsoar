import asyncio
import hashlib
import json
import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError, field_validator
from sqlalchemy import text
from xsoar_common import outbox
from xsoar_common.db import make_sessionmaker
from xsoar_common.envelope import make_envelope
from xsoar_common.logging import setup_logging
from xsoar_common.mq import Publisher, connect, declare_topology
from xsoar_common.mq.topology import ALERTS_EXCHANGE
from xsoar_contracts.alert_created import AlertCreated

from xsoar_collector.settings import Settings

log = logging.getLogger("xsoar_collector")

SCHEMA = "collector"
SOURCE = "web-upload"
MAX_TEXT_BYTES = 1024 * 1024
# JSON escaping can inflate a 1 MiB text, so the body limit is higher
MAX_BODY_BYTES = 2 * MAX_TEXT_BYTES
MAX_LABELS = 20
LABEL_KEY = re.compile(r"^[a-z][a-z0-9]*(_[a-z0-9]+)*$")


class AlertIn(BaseModel):
    text: str
    filename: str | None = None
    labels: dict[str, str] = {}

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be empty")
        return value

    @field_validator("labels")
    @classmethod
    def labels_valid(cls, value: dict[str, str]) -> dict[str, str]:
        if len(value) > MAX_LABELS:
            raise ValueError(f"at most {MAX_LABELS} labels")
        bad = [key for key in value if not LABEL_KEY.match(key)]
        if bad:
            raise ValueError(f"label keys must be snake_case: {bad}")
        return value


async def read_body(request: Request) -> bytes:
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_BODY_BYTES:
            raise HTTPException(413, "request body too large")
        chunks.append(chunk)
    return b"".join(chunks)


def create_app() -> FastAPI:
    settings = Settings()  # type: ignore[call-arg]
    setup_logging(settings.log_level)
    sessions = make_sessionmaker(settings.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        connection = await connect(str(settings.rabbitmq_url))
        channel = await connection.channel()
        await declare_topology(channel, [])
        app.state.publisher = Publisher(channel)
        background = [
            asyncio.create_task(outbox.relay_loop(sessions, SCHEMA, app.state.publisher)),
            asyncio.create_task(outbox.cleanup_loop(sessions, SCHEMA, has_inbox=False)),
        ]
        yield
        for task in background:
            task.cancel()
        await connection.close()

    app = FastAPI(title="X SOAR collector", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware, allow_origins=settings.cors_origin_list, allow_methods=["POST"],
        allow_headers=["content-type"],
    )

    @app.post("/alerts", status_code=202)
    async def create_alert(request: Request):
        body = await read_body(request)
        try:
            alert = AlertIn.model_validate_json(body)
        except ValidationError as exc:
            return JSONResponse(status_code=422, content={"detail": jsonable_encoder(exc.errors())})
        content = alert.text.encode()
        if len(content) > MAX_TEXT_BYTES:
            raise HTTPException(413, "text is larger than 1 MiB")

        line_count = len([line for line in alert.text.splitlines() if line.strip()])
        async with sessions() as session, session.begin():
            row = (
                await session.execute(
                    text(
                        "INSERT INTO collector.alerts "
                        "(source, labels, filename, sha256, size_bytes, line_count, content) "
                        "VALUES (:source, CAST(:labels AS jsonb), :filename, :sha256, :size, "
                        ":lines, :content) RETURNING alert_id, number, received_at"
                    ),
                    {
                        "source": SOURCE,
                        "labels": json.dumps(alert.labels),
                        "filename": alert.filename,
                        "sha256": hashlib.sha256(content).hexdigest(),
                        "size": len(content),
                        "lines": line_count,
                        "content": alert.text,
                    },
                )
            ).one()
            created = AlertCreated(
                alert_id=row.alert_id,
                number=row.number,
                source=SOURCE,
                labels=alert.labels,
                filename=alert.filename,
                received_at=row.received_at,
                text=alert.text,
            )
            envelope = make_envelope("alert.created", row.alert_id, created)
            message = await outbox.add(session, SCHEMA, ALERTS_EXCHANGE, "alert.created", envelope)

        await outbox.publish_now(sessions, SCHEMA, app.state.publisher, [message])
        log.info("alert ALR-%06d accepted, %d lines", row.number, line_count)
        return {"alert_id": str(row.alert_id), "number": row.number}

    return app
