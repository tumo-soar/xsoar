import re
from dataclasses import dataclass

SECRET_PATTERNS = [
    (re.compile(r"(?i)\b(password|passwd|pwd|token|secret|api[_-]?key)(\s*[=:]\s*)\S+"), r"\1\2***"),
    (re.compile(r"(?i)\b(bearer\s+)[A-Za-z0-9._~+/=-]+"), r"\1***"),
]

IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
USER_RES = [
    re.compile(r"(?i)\buser[=:]\s*([\w.@-]+)"),
    re.compile(r"(?i)\bfor (?:invalid user )?([\w.-]+) from\b"),
    re.compile(r"(?i)\binvalid user ([\w.-]+)"),
]
KEYWORDS = ["failed", "error", "denied", "invalid", "disabled", "config change", "login"]


@dataclass
class ParsedLog:
    lines: list[str]
    ips: list[str]
    users: list[str]
    keywords: dict[str, int]
    redacted: int

    def numbered(self) -> str:
        return "\n".join(f"{i}: {line}" for i, line in enumerate(self.lines, start=1))


def redact(line: str) -> tuple[str, int]:
    total = 0
    for pattern, replacement in SECRET_PATTERNS:
        line, count = pattern.subn(replacement, line)
        total += count
    return line, total


def parse(lines: list[str]) -> ParsedLog:
    clean, redacted = [], 0
    for line in lines:
        line, count = redact(line)
        clean.append(line)
        redacted += count

    text = "\n".join(clean)
    users = {m for regex in USER_RES for m in regex.findall(text)}
    return ParsedLog(
        lines=clean,
        ips=sorted(set(IP_RE.findall(text))),
        users=sorted(users),
        keywords={kw: text.lower().count(kw) for kw in KEYWORDS if kw in text.lower()},
        redacted=redacted,
    )
