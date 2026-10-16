import { useShow } from "@refinedev/core";
import {
  ArrowUpRightIcon,
  BanIcon,
  CopyIcon,
  FileSearchIcon,
  GlobeIcon,
  HelpCircleIcon,
  NetworkIcon,
  PlayIcon,
  ServerCrashIcon,
  SirenIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewBadge } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { SeverityBadge } from "@/components/soar/severity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type Alert, REFRESH_MS, alertNumber, alertSeverity, isInProgress } from "./alert";
import { extractIndicators } from "./indicators";
import { Pipeline } from "./pipeline";
import { StatusBadge } from "./status-badge";
import { ConfidenceMeter, VerdictLabel } from "./verdict";

const Section = ({
  title,
  aside,
  children,
  className,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("rounded-xl border bg-card", className)}>
    <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <h2 className="text-sm font-medium">{title}</h2>
      {aside}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export const AlertShow = () => {
  const { result: alert, query } = useShow<Alert>({
    errorNotification: false,
    queryOptions: {
      refetchInterval: (q) =>
        !q.state.data || isInProgress(q.state.data.data.status) ? REFRESH_MS : false,
      // Right after upload the orchestrator may not have created the alert yet.
      retry: (failureCount, error) => error?.statusCode === 404 && failureCount < 15,
      retryDelay: 1000,
    },
  });

  if (query.isError) {
    return (
      <>
        <PageHeader title="Alert" back={{ to: "/alerts", label: "Alerts" }} />
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<ServerCrashIcon />}
            title="This alert could not be loaded"
            description={query.error?.message}
          />
        </div>
      </>
    );
  }

  if (!alert) return <LoadingDetail />;

  const { report } = alert;
  const severity = alertSeverity(alert);

  return (
    <>
      <PageHeader
        back={{ to: "/alerts", label: "Alerts" }}
        title={<span className="font-mono">{alertNumber(alert.number)}</span>}
        meta={
          <>
            <SeverityBadge severity={severity} />
            <StatusBadge status={alert.status} />
            <span>
              Received <RelativeTime date={alert.received_at} />
            </span>
            <span>{alert.source}</span>
            {alert.filename && <span className="font-mono text-xs">{alert.filename}</span>}
            {Object.entries(alert.labels).map(([key, value]) => (
              <span key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {key}={value}
              </span>
            ))}
          </>
        }
      />

      <section className="rounded-xl border bg-card px-4 py-5">
        <Pipeline alert={alert} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {isInProgress(alert.status) && (
            <div className="flex items-center gap-3 rounded-xl border border-sev-low/30 bg-sev-low/5 px-4 py-3 text-sm">
              <span className="live-dot size-2 rounded-full bg-sev-low" />
              AI alert validation is running. This page updates by itself.
            </div>
          )}

          {alert.error && (
            <div className="flex items-start gap-3 rounded-xl border border-sev-medium/30 bg-sev-medium/5 px-4 py-3 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-sev-medium" />
              <div>
                <p className="font-medium">Needs a manual check</p>
                <p className="mt-0.5 text-muted-foreground">{alert.error}</p>
              </div>
            </div>
          )}

          {report && (
            <>
              <Section
                title={
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="size-4 text-primary" />
                    AI assessment
                  </span>
                }
                aside={<span className="text-xs text-muted-foreground">{report.model}</span>}
              >
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Verdict</p>
                    <VerdictLabel verdict={report.verdict} className="text-xl" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Confidence</p>
                    <ConfidenceMeter value={report.confidence} verdict={report.verdict} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Facts</p>
                    <p className="text-xl font-medium tabular-nums">{report.facts.length}</p>
                  </div>
                </div>
                {report.summary && (
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-pretty">
                    {report.summary}
                  </p>
                )}
              </Section>

              <Section
                title="Evidence"
                aside={
                  <span className="text-xs text-muted-foreground">
                    Every fact cites lines that exist in the log
                  </span>
                }
              >
                {report.facts.length === 0 ? (
                  <EmptyState
                    icon={<FileSearchIcon />}
                    title="No facts backed by the log"
                    description="The model's claims did not point to real log lines, so they were dropped."
                    className="py-6"
                  />
                ) : (
                  <ol className="space-y-5">
                    {report.facts.map((fact, i) => (
                      <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                        <span className="pt-px text-sm text-muted-foreground tabular-nums">
                          {i + 1}.
                        </span>
                        <div className="space-y-2">
                          <p className="text-sm text-pretty">{fact.text}</p>
                          <LogLines evidence={fact.evidence} />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>

              {!!report.open_questions?.length && (
                <Section title="Open questions for the analyst">
                  <ul className="space-y-2.5">
                    {report.open_questions.map((question, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <HelpCircleIcon className="mt-0.5 size-4 shrink-0 text-sev-medium" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <ResponsePanel />
          {report && <IndicatorsPanel alert={alert} />}
          <DetailsPanel alert={alert} />
        </aside>
      </div>
    </>
  );
};

const LogLines = ({ evidence }: { evidence: { line: number; text: string }[] }) => (
  <div className="overflow-hidden rounded-lg border bg-muted/30 font-mono text-xs">
    {evidence.map((e) => (
      <div key={e.line} className="flex border-b last:border-b-0">
        <span className="w-12 shrink-0 border-r bg-muted/40 px-2 py-1.5 text-right text-muted-foreground select-none tabular-nums">
          {e.line}
        </span>
        <code className="min-w-0 px-3 py-1.5 break-all whitespace-pre-wrap">{e.text}</code>
      </div>
    ))}
  </div>
);

const RESPONSE_ACTIONS = [
  { label: "Escalate to incident", icon: SirenIcon },
  { label: "Run a playbook", icon: PlayIcon },
  { label: "Dismiss as benign", icon: BanIcon },
];

const ResponsePanel = () => (
  <Section title="Respond" aside={<PreviewBadge />}>
    <div className="flex flex-col gap-2">
      {RESPONSE_ACTIONS.map(({ label, icon: Icon }) => (
        <Button key={label} variant="outline" className="justify-start" disabled>
          <Icon />
          {label}
        </Button>
      ))}
    </div>
    <p className="mt-3 text-xs text-pretty text-muted-foreground">
      Analyst decisions are planned. The alert statuses DISMISSED and ESCALATED are reserved for
      them.
    </p>
  </Section>
);

const IndicatorsPanel = ({ alert }: { alert: Alert }) => {
  const indicators = alert.report ? extractIndicators(alert.report) : [];
  return (
    <Section
      title="Indicators in evidence"
      aside={<span className="text-xs text-muted-foreground tabular-nums">{indicators.length}</span>}
    >
      {indicators.length === 0 ? (
        <p className="text-sm text-muted-foreground">No IP addresses or domains in the cited lines.</p>
      ) : (
        <ul className="space-y-2">
          {indicators.map((ioc) => {
            const Icon = ioc.type === "ip" ? NetworkIcon : GlobeIcon;
            return (
              <li key={ioc.value} className="flex items-center gap-2 text-sm">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs" title={ioc.value}>
                  {ioc.value}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  line {ioc.lines.join(", ")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Found in the browser by scanning evidence lines. Reputation lookups are planned.
      </p>
    </Section>
  );
};

const DetailsPanel = ({ alert }: { alert: Alert }) => {
  const copyId = async () => {
    await navigator.clipboard.writeText(alert.id);
    toast.success("Alert ID copied");
  };
  const rows: [string, React.ReactNode][] = [
    [
      "ID",
      <button
        type="button"
        onClick={copyId}
        className="group inline-flex max-w-full items-center gap-1.5 font-mono text-xs hover:text-foreground"
        title="Copy"
      >
        <span className="truncate">{alert.id}</span>
        <CopyIcon className="size-3 shrink-0 opacity-60 group-hover:opacity-100" />
      </button>,
    ],
    ["Source", alert.source],
    ["File", alert.filename ?? "—"],
    ["Received", absoluteTime(alert.received_at)],
  ];
  if (alert.updated_at) rows.push(["Updated", absoluteTime(alert.updated_at)]);

  return (
    <Section title="Details">
      <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={`${import.meta.env.VITE_API_URL}/alerts/${alert.id}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Raw JSON from api
        <ArrowUpRightIcon className="size-3" />
      </a>
    </Section>
  );
};

const LoadingDetail = () => (
  <div className="flex flex-col gap-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
    </div>
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  </div>
);
