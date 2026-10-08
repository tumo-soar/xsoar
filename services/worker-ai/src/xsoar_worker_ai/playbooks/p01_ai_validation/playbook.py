from pathlib import Path

from xsoar_common.worker import Playbook, playbook
from xsoar_contracts.p01_ai_validation_input import P01Input
from xsoar_contracts.p01_ai_validation_output import P01Report

from xsoar_worker_ai.llm import LLM
from xsoar_worker_ai.playbooks.p01_ai_validation.grounding import LLMAnswer, ground, parse_answer

SYSTEM_PROMPT = (Path(__file__).parent / "prompt.txt").read_text(encoding="utf-8")


def build_user_message(lines: list[str]) -> str:
    # the log is untrusted: it must not be able to close the data block
    numbered = "\n".join(f"{i}: {line}" for i, line in enumerate(lines, start=1))
    numbered = numbered.replace("<<<LOG", "<<LOG").replace("LOG>>>", "LOG>>")
    return f"<<<LOG\n{numbered}\nLOG>>>"


def make_playbook(llm: LLM, max_lines: int) -> Playbook:
    @playbook("p01_ai_validation", timeout=120, input=P01Input)
    async def p01_ai_validation(inp: P01Input) -> P01Report:
        if len(inp.lines) > max_lines:
            raise ValueError(f"log has {len(inp.lines)} lines, the limit is {max_lines}")
        completion = await llm.complete(
            SYSTEM_PROMPT, build_user_message(inp.lines), LLMAnswer.model_json_schema()
        )
        answer = parse_answer(completion.text)
        return P01Report(
            summary=answer.summary,
            verdict=answer.verdict,
            confidence=answer.confidence,
            facts=ground(answer, inp.lines),
            open_questions=answer.open_questions,
            model=completion.model,
        )

    return p01_ai_validation
