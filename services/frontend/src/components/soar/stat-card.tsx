import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Change versus the previous period. `goodWhen` says which direction is an improvement. */
  trend?: { value: string; direction: "up" | "down"; goodWhen: "up" | "down" };
  tone?: "default" | "critical" | "warning" | "success";
  className?: string;
};

const TONES = {
  default: "text-muted-foreground",
  critical: "text-sev-critical",
  warning: "text-sev-medium",
  success: "text-success",
};

export const StatCard = ({
  label,
  value,
  hint,
  icon,
  trend,
  tone = "default",
  className,
}: StatCardProps) => {
  const good = trend && trend.direction === trend.goodWhen;
  const TrendIcon = trend?.direction === "up" ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className={cn("[&>svg]:size-4", TONES[tone])}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium tabular-nums",
              good ? "text-success" : "text-sev-critical",
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend.value}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
};
