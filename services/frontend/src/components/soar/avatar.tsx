import { cn } from "@/lib/utils";
import { ANALYSTS } from "@/preview/data";

export const AnalystAvatar = ({
  id,
  showName = false,
  className,
}: {
  id: string | null;
  showName?: boolean;
  className?: string;
}) => {
  const analyst = id ? ANALYSTS[id] : null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          analyst ? "bg-primary/15 text-primary" : "border border-dashed text-muted-foreground",
        )}
        title={analyst?.name ?? "Unassigned"}
      >
        {analyst?.initials ?? "?"}
      </span>
      {showName && (
        <span className={cn("truncate text-sm", !analyst && "text-muted-foreground")}>
          {analyst?.name ?? "Unassigned"}
        </span>
      )}
    </span>
  );
};
