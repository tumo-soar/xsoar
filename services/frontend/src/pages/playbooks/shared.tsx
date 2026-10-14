import { cn } from "@/lib/utils";
import type { Playbook } from "@/preview/data";

export const PlaybookStatus = ({ status }: { status: Playbook["status"] }) => (
  <span
    className={cn(
      "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium",
      status === "live" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
    )}
  >
    {status === "live" && <span className="live-dot size-1.5 rounded-full bg-current" />}
    {status === "live" ? "Live" : "Planned"}
  </span>
);
