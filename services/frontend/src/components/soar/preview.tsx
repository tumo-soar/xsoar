import { FlaskConicalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const PreviewBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex h-4 items-center rounded px-1 text-[10px] font-medium uppercase tracking-wide",
      "bg-sev-low/12 text-sev-low",
      className,
    )}
  >
    Preview
  </span>
);

/** Shown at the top of every screen whose backend does not exist yet. */
export const PreviewNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 rounded-lg border border-dashed border-sev-low/30 bg-sev-low/5 px-4 py-3 text-sm">
    <FlaskConicalIcon className="mt-0.5 size-4 shrink-0 text-sev-low" />
    <p className="text-muted-foreground">
      <span className="font-medium text-foreground">Preview with sample data.</span>{" "}
      {children}
    </p>
  </div>
);
