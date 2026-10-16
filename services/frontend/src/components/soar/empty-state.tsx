import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
      className,
    )}
  >
    {icon && (
      <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5">
        {icon}
      </div>
    )}
    <p className="text-sm font-medium">{title}</p>
    {description && (
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
