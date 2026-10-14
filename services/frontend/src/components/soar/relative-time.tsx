import { useEffect, useState } from "react";

import { absoluteTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "3 minutes ago", re-rendered every 30 seconds; the exact time is in the tooltip. */
export const RelativeTime = ({ date, className }: { date: string | Date; className?: string }) => {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time
      dateTime={new Date(date).toISOString()}
      title={absoluteTime(date)}
      className={cn("tabular-nums", className)}
    >
      {relativeTime(date)}
    </time>
  );
};
