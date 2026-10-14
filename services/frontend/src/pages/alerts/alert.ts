import type { P01Report } from "@contracts/playbooks/p01_ai_validation.output.schema";

import type { Severity } from "@/components/soar/severity";

export type Alert = {
  id: string;
  number: number;
  source: string;
  labels: Record<string, string>;
  filename: string | null;
  status: string;
  report: P01Report | null;
  error: string | null;
  received_at: string;
  updated_at?: string;
};

export type Verdict = P01Report["verdict"];

export const alertNumber = (n: number) => `ALR-${String(n).padStart(6, "0")}`;

const IN_PROGRESS = ["RECEIVED", "ANALYZING"];

export const isInProgress = (status: string) => IN_PROGRESS.includes(status);

export const REFRESH_MS = 3000;

/**
 * The backend has no severity yet. The UI derives one from the AI verdict so the
 * queue can be sorted by urgency at a glance.
 */
export const alertSeverity = (alert: Pick<Alert, "status" | "report">): Severity => {
  const { report } = alert;
  if (!report) return alert.status === "MANUAL_CHECK_REQUIRED" ? "medium" : "info";
  if (report.verdict === "suspicious") return report.confidence >= 0.8 ? "critical" : "high";
  if (report.verdict === "unclear") return "medium";
  return "low";
};
