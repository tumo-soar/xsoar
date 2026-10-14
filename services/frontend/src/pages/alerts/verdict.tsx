import { cn } from "@/lib/utils";
import { percent } from "@/lib/format";
import type { Verdict } from "./alert";

const STYLES: Record<Verdict, { label: string; text: string; bar: string }> = {
  suspicious: { label: "Suspicious", text: "text-sev-critical", bar: "bg-sev-critical" },
  unclear: { label: "Unclear", text: "text-sev-medium", bar: "bg-sev-medium" },
  benign: { label: "Benign", text: "text-success", bar: "bg-success" },
};

export const VerdictLabel = ({ verdict, className }: { verdict: Verdict; className?: string }) => (
  <span className={cn("font-medium", STYLES[verdict].text, className)}>
    {STYLES[verdict].label}
  </span>
);

/** A 0–1 confidence value as a thin bar plus a percentage. */
export const ConfidenceMeter = ({
  value,
  verdict,
  className,
}: {
  value: number;
  verdict: Verdict;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label="Confidence"
      className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full origin-left rounded-full", STYLES[verdict].bar)}
        style={{ transform: `scaleX(${value})` }}
      />
    </div>
    <span className="text-xs text-muted-foreground tabular-nums">{percent(value)}</span>
  </div>
);
