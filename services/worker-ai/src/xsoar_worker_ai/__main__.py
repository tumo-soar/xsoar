import asyncio

from xsoar_common.logging import setup_logging
from xsoar_common.worker import run_worker

from xsoar_worker_ai.llm import make_llm
from xsoar_worker_ai.playbooks.p01_ai_validation.playbook import make_playbook
from xsoar_worker_ai.settings import Settings


async def main() -> None:
    settings = Settings()  # type: ignore[call-arg]
    setup_logging(settings.log_level)
    llm = make_llm(settings)
    playbooks = [make_playbook(llm, settings.max_log_lines)]
    await run_worker(playbooks, str(settings.rabbitmq_url), settings.prefetch)


if __name__ == "__main__":
    asyncio.run(main())
