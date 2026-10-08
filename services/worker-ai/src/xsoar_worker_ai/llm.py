import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Protocol

import httpx

from xsoar_worker_ai.settings import Settings

log = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1"


class LLMError(Exception):
    pass


@dataclass
class Completion:
    text: str
    model: str


class LLM(Protocol):
    async def complete(self, system: str, user: str, response_schema: dict[str, Any]) -> Completion: ...


class OpenAICompatibleLLM:
    """Any server that speaks POST /chat/completions: OpenRouter, Ollama (/v1), vLLM, OpenAI."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        timeout_s: float,
        retries: int = 2,
        backoff_s: float = 2,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.url = f"{base_url.rstrip('/')}/chat/completions"
        self.api_key = api_key
        self.model = model
        self.retries = retries
        self.backoff_s = backoff_s
        self.client = client or httpx.AsyncClient(timeout=timeout_s)

    async def complete(self, system: str, user: str, response_schema: dict[str, Any]) -> Completion:
        if not self.api_key or not self.model:
            raise LLMError("LLM is not configured: set the API key and the model")
        payload = {
            "model": self.model,
            "temperature": 0,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "answer", "schema": response_schema},
            },
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}

        problem = ""
        for attempt in range(self.retries + 1):
            delay = self.backoff_s * 2**attempt
            try:
                response = await self.client.post(self.url, headers=headers, json=payload)
            except httpx.HTTPError as exc:
                problem = f"{type(exc).__name__}: {exc}"
            else:
                if response.status_code < 400:
                    return self._parse(response)
                if response.status_code != 429 and response.status_code < 500:
                    raise LLMError(f"HTTP {response.status_code}: {response.text[:200]}")
                problem = f"HTTP {response.status_code}"
                delay = _retry_after(response) or delay
            if attempt < self.retries:
                log.warning("LLM call failed (%s), retry in %.0fs", problem, delay)
                await asyncio.sleep(delay)
        raise LLMError(f"LLM unavailable after {self.retries + 1} attempts: {problem}")

    def _parse(self, response: httpx.Response) -> Completion:
        data = response.json()
        try:
            return Completion(data["choices"][0]["message"]["content"], data.get("model") or self.model)
        except (KeyError, IndexError, TypeError):
            raise LLMError(f"unexpected LLM response: {str(data)[:200]}") from None


def _retry_after(response: httpx.Response) -> float | None:
    try:
        return min(float(response.headers["retry-after"]), 30)
    except (KeyError, ValueError):
        return None


def make_llm(settings: Settings) -> LLM:
    if settings.llm_provider == "openrouter":
        return OpenAICompatibleLLM(
            OPENROUTER_URL,
            settings.openrouter_api_key,
            settings.openrouter_model,
            settings.llm_timeout_s,
        )
    raise ValueError(f"unknown LLM_PROVIDER: {settings.llm_provider!r}")
