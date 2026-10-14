import { formatDistanceToNowStrict } from "date-fns";

import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/preview/data";

export const INCIDENT_STATUSES: { value: IncidentStatus; label: string; className: string }[] = [
  { value: "new", label: "New", className: "bg-sev-low/12 text-sev-low" },
  { value: "investigating", label: "Investigating", className: "bg-sev-medium/14 text-sev-medium" },
  { value: "contained", label: "Contained", className: "bg-primary/12 text-primary" },
  { value: "resolved", label: "Resolved", className: "bg-muted text-muted-foreground" },
];

export const IncidentStatusBadge = ({ status }: { status: IncidentStatus }) => {
  const style = INCIDENT_STATUSES.find((s) => s.value === status)!;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium whitespace-nowrap",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
};

/** Time left until the SLA deadline; red once breached, amber in the last hour. */
export const SlaTimer = ({
  dueAt,
  resolved,
  className,
}: {
  dueAt: string;
  resolved?: boolean;
  className?: string;
}) => {
  if (resolved) return <span className={cn("text-muted-foreground", className)}>Met</span>;
  const msLeft = new Date(dueAt).getTime() - Date.now();
  const distance = formatDistanceToNowStrict(new Date(dueAt));
  return (
    <span
      className={cn(
        "tabular-nums",
        msLeft < 0 ? "text-sev-critical" : msLeft < 3_600_000 ? "text-sev-medium" : "text-muted-foreground",
        className,
      )}
    >
      {msLeft < 0 ? `Breached ${distance} ago` : `${distance} left`}
    </span>
  );
};
