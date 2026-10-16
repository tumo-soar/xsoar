import { CheckIcon, CircleDashedIcon, LoaderIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Alert } from "./alert";

type StepState = "done" | "running" | "failed" | "waiting" | "planned";

type Step = { title: string; caption: string; state: StepState };

const stepsFor = (alert: Alert): Step[] => {
  const ai: StepState =
    alert.status === "RECEIVED"
      ? "waiting"
      : alert.status === "ANALYZING"
        ? "running"
        : alert.report
          ? "done"
          : "failed";
  const decided = ["DISMISSED", "ESCALATED", "SUPPRESSED"].includes(alert.status);

  return [
    { title: "Received", caption: "collector", state: "done" },
    { title: "AI validation", caption: "P01 · worker-ai", state: ai },
    { title: "Change approval", caption: "P02 · planned", state: "planned" },
    { title: "SIEM control", caption: "P03 · planned", state: "planned" },
    { title: "Business impact", caption: "P04 · planned", state: "planned" },
    {
      title: "Analyst decision",
      caption: decided ? "done" : "not built yet",
      state: decided ? "done" : "planned",
    },
  ];
};

const NODE: Record<StepState, string> = {
  done: "bg-success text-primary-foreground border-transparent",
  running: "border-sev-low text-sev-low bg-sev-low/10",
  failed: "bg-sev-medium text-background border-transparent",
  waiting: "border-border text-muted-foreground bg-background",
  planned: "border-dashed border-border text-muted-foreground/60 bg-background",
};

const NodeIcon = ({ state }: { state: StepState }) => {
  if (state === "done") return <CheckIcon className="size-3.5" strokeWidth={3} />;
  if (state === "running") return <LoaderIcon className="size-3.5 animate-spin" />;
  if (state === "failed") return <TriangleAlertIcon className="size-3.5" />;
  return <CircleDashedIcon className="size-3.5" />;
};

/** Where the alert is in the main playbook. Only the first two steps exist in the backend today. */
export const Pipeline = ({ alert }: { alert: Alert }) => {
  const steps = stepsFor(alert);
  return (
    <ol className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex flex-col items-start gap-2 pr-3">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-3.5 left-8 right-0 hidden h-px lg:block",
                step.state === "done" ? "bg-success/50" : "border-t border-dashed border-border bg-transparent",
              )}
            />
          )}
          <span
            className={cn(
              "relative z-10 flex size-7 items-center justify-center rounded-full border transition-colors duration-300",
              NODE[step.state],
            )}
          >
            <NodeIcon state={step.state} />
          </span>
          <div className="space-y-0.5">
            <p
              className={cn(
                "text-sm font-medium",
                step.state === "planned" && "text-muted-foreground",
              )}
            >
              {step.title}
            </p>
            <p className="text-xs text-muted-foreground">{step.caption}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
