import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  RECEIVED: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  ANALYZING: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  ANALYZED: "bg-green-500/15 text-green-700 dark:text-green-300",
  MANUAL_CHECK_REQUIRED: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  DISMISSED: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  ESCALATED: "bg-red-500/15 text-red-700 dark:text-red-300",
  SUPPRESSED: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="outline" className={cn("border-transparent", COLORS[status])}>
    {status.replaceAll("_", " ")}
  </Badge>
);
