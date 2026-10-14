import { cn } from "@/lib/utils";
import { isInProgress } from "./alert";

const STYLES: Record<string, { label: string; className: string }> = {
  RECEIVED: { label: "Received", className: "bg-sev-info/12 text-sev-info" },
  ANALYZING: { label: "Analyzing", className: "bg-sev-low/12 text-sev-low" },
  ANALYZED: { label: "Analyzed", className: "bg-success/12 text-success" },
  MANUAL_CHECK_REQUIRED: {
    label: "Needs manual check",
    className: "bg-sev-medium/14 text-sev-medium",
  },
  DISMISSED: { label: "Dismissed", className: "bg-sev-info/12 text-sev-info" },
  ESCALATED: { label: "Escalated", className: "bg-sev-critical/12 text-sev-critical" },
  SUPPRESSED: { label: "Suppressed", className: "bg-sev-info/12 text-sev-info" },
};

export const statusLabel = (status: string) =>
  STYLES[status]?.label ?? status.replaceAll("_", " ").toLowerCase();

export const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium whitespace-nowrap",
        style?.className ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {isInProgress(status) && (
        <span aria-hidden className="live-dot size-1.5 rounded-full bg-current" />
      )}
      {statusLabel(status)}
    </span>
  );
};
