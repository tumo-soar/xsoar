import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

const STYLES: Record<Severity, { dot: string; badge: string; label: string }> = {
  critical: {
    dot: "bg-sev-critical",
    badge: "bg-sev-critical/12 text-sev-critical ring-sev-critical/25",
    label: "Critical",
  },
  high: {
    dot: "bg-sev-high",
    badge: "bg-sev-high/12 text-sev-high ring-sev-high/25",
    label: "High",
  },
  medium: {
    dot: "bg-sev-medium",
    badge: "bg-sev-medium/12 text-sev-medium ring-sev-medium/25",
    label: "Medium",
  },
  low: {
    dot: "bg-sev-low",
    badge: "bg-sev-low/12 text-sev-low ring-sev-low/25",
    label: "Low",
  },
  info: {
    dot: "bg-sev-info",
    badge: "bg-sev-info/12 text-sev-info ring-sev-info/25",
    label: "Info",
  },
};

export const severityLabel = (severity: Severity) => STYLES[severity].label;

export const SeverityDot = ({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) => (
  <span
    aria-hidden
    className={cn("inline-block size-2 shrink-0 rounded-full", STYLES[severity].dot, className)}
  />
);

export const SeverityBadge = ({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium ring-1 ring-inset",
      STYLES[severity].badge,
      className,
    )}
  >
    <SeverityDot severity={severity} className="size-1.5" />
    {STYLES[severity].label}
  </span>
);

/** Severity bar used in lists: a thin colored strip on the left edge of a row. */
export const SeverityStrip = ({ severity }: { severity: Severity }) => (
  <span
    aria-hidden
    className={cn("absolute inset-y-1.5 left-0 w-0.5 rounded-full", STYLES[severity].dot)}
  />
);
