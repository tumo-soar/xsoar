import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { cn } from "@/lib/utils";
import { INTEGRATIONS, type Integration } from "@/preview/data";

const STATUS: Record<Integration["status"], { label: string; className: string; dot: string }> = {
  connected: { label: "Connected", className: "text-success", dot: "bg-success" },
  available: { label: "Available", className: "text-sev-low", dot: "bg-sev-low" },
  planned: { label: "Planned", className: "text-muted-foreground", dot: "border border-muted-foreground/50" },
};

export const IntegrationList = () => {
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Where logs come from, which AI model reads them and which tools the playbooks will call."
      />
      <PreviewNotice>
        Connections are configured through environment variables today. This page shows what they are and what is planned.
      </PreviewNotice>

      {categories.map((category) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.filter((i) => i.category === category).map((integration) => {
              const status = STATUS[integration.status];
              return (
                <article key={integration.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                        {integration.name.slice(0, 2)}
                      </span>
                      <h3 className="font-medium">{integration.name}</h3>
                    </div>
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium", status.className)}>
                      <span className={cn("size-2 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-pretty text-muted-foreground">{integration.description}</p>
                  {(integration.usedBy || integration.detail) && (
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                      {integration.usedBy && (
                        <span>
                          Used by <span className="font-mono text-foreground">{integration.usedBy}</span>
                        </span>
                      )}
                      {integration.detail && <span className="font-mono">{integration.detail}</span>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
};
