import { ChevronLeftIcon } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { to: string; label: string };
  meta?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  actions,
  back,
  meta,
  className,
}: PageHeaderProps) => (
  <div className={cn("flex flex-col gap-3", className)}>
    {back && (
      <Link
        to={back.to}
        className="-ml-1 inline-flex w-fit items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        {back.label}
      </Link>
    )}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-sm text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
);
