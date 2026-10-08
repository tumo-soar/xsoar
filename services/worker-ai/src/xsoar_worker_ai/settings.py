from pydantic import AmqpDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rabbitmq_url: AmqpDsn
    prefetch: int = 1
    log_level: str = "INFO"
    max_log_lines: int = 500

    llm_provider: str = "openrouter"
    llm_timeout_s: float = 30
    openrouter_api_key: str = ""
    openrouter_model: str = ""
