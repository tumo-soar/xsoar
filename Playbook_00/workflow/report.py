import json
from dataclasses import asdict

from config.settings import RESULTS
from workflow.investigation import Investigation


def save_report(inv: Investigation) -> None:
    (RESULTS / f"{inv.id}.json").write_text(json.dumps(asdict(inv), indent=2, ensure_ascii=False), encoding="utf-8")
    (RESULTS / f"{inv.id}.md").write_text(to_markdown(inv), encoding="utf-8")


def _one_line(text: str) -> str:
    return " ".join(str(text).split())


def to_markdown(inv: Investigation) -> str:
    md = [
        f"# Investigation {inv.id}",
        "",
        f"**Status:** {inv.status} | **Priority:** {inv.priority or '-'} | **Next owner:** {inv.next_owner}",
        "",
        f"**System:** {inv.system} | **Source file:** {inv.source_file} | **Created:** {inv.created_at}",
        "",
        "## Recommendation",
        inv.recommendation,
        "",
    ]

    ai = inv.ai_result
    if ai and ai["status"] == "ok":
        md += [
            "## AI summary (must be verified by the analyst)",
            ai["summary"],
            "",
            f"Assessment: **{ai['assessment']}**, confidence {ai['confidence']:.2f}, model `{ai['model']}`",
            "",
            "### Facts found in the log",
        ]
        md += [f"- line {f['line']}: {f['statement']} - `{f['quote']}`" for f in ai["facts"]] or ["- none"]
        if ai["unverified_facts"]:
            md += ["", "### Facts NOT found in the log"]
            md += [f"- line {f['line']}: {f['statement']} - `{f['quote']}`" for f in ai["unverified_facts"]]
        md += ["", "### Open questions"]
        md += [f"- {q}" for q in ai["open_questions"]] or ["- none"]
    elif ai:
        md += ["## AI validation failed", f"Error: `{_one_line(ai['error'])}`"]

    md += ["", "## Steps", "", "| Step | Status | Details |", "|---|---|---|"]
    md += [f"| {s['step']} | {s['status']} | {_one_line(s['details'])} |" for s in inv.steps]
    return "\n".join(md) + "\n"
