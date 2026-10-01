import httpx

from config.settings import AI_API_KEY, AI_BASE_URL, AI_ENABLED, AI_MODEL, AI_TIMEOUT_SECONDS


def ask_ai(messages: list[dict]) -> str:
    if not AI_ENABLED:
        raise RuntimeError("AI is not configured: set AI_API_KEY and AI_MODEL in .env")

    response = httpx.post(
        f"{AI_BASE_URL.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {AI_API_KEY}", "X-Title": "XSOAR AI Alert Validation"},
        json={"model": AI_MODEL, "messages": messages, "temperature": 0},
        timeout=AI_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
