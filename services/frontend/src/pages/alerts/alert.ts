import type { P01Report } from "@contracts/playbooks/p01_ai_validation.output.schema";

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
};

export const alertNumber = (n: number) => `ALR-${String(n).padStart(6, "0")}`;

const IN_PROGRESS = ["RECEIVED", "ANALYZING"];

export const isInProgress = (status: string) => IN_PROGRESS.includes(status);

export const REFRESH_MS = 3000;
