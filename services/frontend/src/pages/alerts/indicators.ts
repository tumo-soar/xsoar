import type { P01Report } from "@contracts/playbooks/p01_ai_validation.output.schema";

export type ExtractedIndicator = { value: string; type: "ip" | "domain"; lines: number[] };

const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
// A fixed TLD list keeps file names such as dump.sql or app.py out of the results.
const DOMAIN =
  /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|io|am|ru|cn|info|biz|xyz|top|dev|app|cloud|online|site|co|me|internal|local)\b/gi;

/** IPs and domains mentioned in the evidence lines of a report, with the lines they appear on. */
export const extractIndicators = (report: P01Report): ExtractedIndicator[] => {
  const found = new Map<string, ExtractedIndicator>();
  const add = (value: string, type: ExtractedIndicator["type"], line: number) => {
    const key = value.toLowerCase();
    const entry = found.get(key) ?? { value: key, type, lines: [] };
    if (!entry.lines.includes(line)) entry.lines.push(line);
    found.set(key, entry);
  };

  for (const fact of report.facts) {
    for (const { line, text } of fact.evidence) {
      for (const match of text.matchAll(IPV4)) add(match[0], "ip", line);
      for (const match of text.matchAll(DOMAIN)) add(match[0], "domain", line);
    }
  }

  return [...found.values()].sort((a, b) => a.lines[0] - b.lines[0]);
};
