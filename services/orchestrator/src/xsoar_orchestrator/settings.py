from pydantic import AmqpDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rabbitmq_url: AmqpDsn
    database_url: str
    # playbook timeout x 3 deliveries + 5 min in the queue (spec, section 3)
    task_deadline_s: int = 660
    sweep_interval_s: int = 60
    prefetch: int = 10
    log_level: str = "INFO"
