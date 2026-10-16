import {
  ActivityIcon,
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  LoaderIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  TimerIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Link } from "react-router";

import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewBadge } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { SEVERITIES, SeverityDot, severityLabel } from "@/components/soar/severity";
import { StatCard } from "@/components/soar/stat-card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDuration, percent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { alertNumber, alertSeverity, isInProgress } from "@/pages/alerts/alert";
import { StatusBadge } from "@/pages/alerts/status-badge";
import { useRecentAlerts } from "@/pages/alerts/use-recent-alerts";
import { ALERT_VOLUME, ANALYSTS, APPROVALS, INCIDENTS, OPERATIONS, PLAYBOOKS } from "@/preview/data";

type Range = "24h" | "7d";

const Card = ({
  title,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("flex flex-col rounded-xl border bg-card", className)}>
    <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
      <h2 className="flex items-center gap-2 text-sm font-medium">{title}</h2>
      {action}
    </header>
    <div className="flex-1 px-4 pb-4">{children}</div>
  </section>
);

const SectionTitle = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</h2>
    {aside}
  </div>
);

export const Overview = () => {
  const [range, setRange] = useState<Range>("24h");

  return (
    <>
      <PageHeader
        title="Overview"
        description="What needs attention now, and how the automation is doing."
      />

      <div className="flex flex-col gap-4">
        <SectionTitle>Live pipeline</SectionTitle>
        <LivePipeline />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle aside={<PreviewBadge />}>Operations</SectionTitle>
          <RangeSwitch value={range} onChange={setRange} />
        </div>
        <Operations range={range} />
      </div>
    </>
  );
};

const RangeSwitch = ({ value, onChange }: { value: Range; onChange: (r: Range) => void }) => (
  <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
    {(["24h", "7d"] as const).map((r) => (
      <button
        key={r}
        type="button"
        onClick={() => onChange(r)}
        className={cn(
          "rounded-md px-2.5 py-1 font-medium transition-colors",
          value === r ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {r === "24h" ? "Last 24 hours" : "Last 7 days"}
      </button>
    ))}
  </div>
);

const verdictChart = {
  suspicious: { label: "Suspicious", color: "var(--sev-critical)" },
  unclear: { label: "Unclear", color: "var(--sev-medium)" },
  benign: { label: "Benign", color: "var(--success)" },
} satisfies ChartConfig;

const LivePipeline = () => {
  const { result, query } = useRecentAlerts();

  if (query.isError) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={<ServerCrashIcon />}
          title="Live data is unavailable"
          description={
            <>
              The api at <code className="font-mono text-xs">{import.meta.env.VITE_API_URL}</code> did not
              answer. The Operations section below still shows sample data.
            </>
          }
        />
      </div>
    );
  }

  const alerts = result.data;
  const inProgress = alerts.filter((a) => isInProgress(a.status)).length;
  const manual = alerts.filter((a) => a.status === "MANUAL_CHECK_REQUIRED").length;
  const suspicious = alerts.filter((a) => a.report?.verdict === "suspicious").length;
  const analyzed = alerts.filter((a) => a.status === "ANALYZED").length;

  const verdicts = (["suspicious", "unclear", "benign"] as const).map((verdict) => ({
    verdict,
    count: alerts.filter((a) => a.report?.verdict === verdict).length,
    fill: `var(--color-${verdict})`,
  }));
  const withReport = verdicts.reduce((sum, v) => sum + v.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-4 lg:col-span-2 xl:grid-cols-4">
        <StatCard
          label="In progress"
          value={query.isLoading ? "–" : inProgress}
          icon={<LoaderIcon />}
          hint="Received or being analyzed"
        />
        <StatCard
          label="Needs manual check"
          value={query.isLoading ? "–" : manual}
          icon={<TriangleAlertIcon />}
          tone={manual > 0 ? "warning" : "default"}
          hint="Playbook failed or timed out"
        />
        <StatCard
          label="Suspicious"
          value={query.isLoading ? "–" : suspicious}
          icon={<ShieldAlertIcon />}
          tone={suspicious > 0 ? "critical" : "default"}
          hint="AI verdict"
        />
        <StatCard
          label="Analyzed"
          value={query.isLoading ? "–" : analyzed}
          icon={<CheckCircle2Icon />}
          tone="success"
          hint={`Of the latest ${alerts.length} alerts`}
        />

        <Card
          title="Latest alerts"
          className="col-span-2 xl:col-span-4"
          action={
            <Link to="/alerts" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All alerts <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {query.isLoading ? "Loading…" : "No alerts yet."}
            </p>
          ) : (
            <ul className="-mx-2 divide-y">
              {alerts.slice(0, 6).map((alert) => (
                <li key={alert.id}>
                  <Link
                    to={`/alerts/show/${alert.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <SeverityDot severity={alertSeverity(alert)} />
                    <span className="w-24 shrink-0 font-mono text-xs">{alertNumber(alert.number)}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {alert.report?.summary ?? alert.error ?? alert.filename ?? alert.source}
                    </span>
                    <StatusBadge status={alert.status} className="hidden sm:inline-flex" />
                    <RelativeTime date={alert.received_at} className="w-24 shrink-0 text-right text-xs text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="AI verdicts" action={<span className="text-xs text-muted-foreground tabular-nums">{withReport} reports</span>}>
        {withReport === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No reports yet.</p>
        ) : (
          <>
            <ChartContainer config={verdictChart} className="mx-auto aspect-square max-h-56">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="verdict" hideLabel />} />
                <Pie
                  data={verdicts}
                  dataKey="count"
                  nameKey="verdict"
                  innerRadius="62%"
                  strokeWidth={2}
                  stroke="var(--card)"
                  isAnimationActive={false}
                >
                  {verdicts.map((v) => (
                    <Cell key={v.verdict} fill={v.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="mt-2 space-y-1.5 text-sm">
              {verdicts.map((v) => (
                <li key={v.verdict} className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: verdictChart[v.verdict].color }} />
                  <span className="flex-1 text-muted-foreground">{verdictChart[v.verdict].label}</span>
                  <span className="tabular-nums">{v.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
};

const volumeChart = {
  critical: { label: "Critical", color: "var(--sev-critical)" },
  high: { label: "High", color: "var(--sev-high)" },
  medium: { label: "Medium", color: "var(--sev-medium)" },
  low: { label: "Low", color: "var(--sev-low)" },
} satisfies ChartConfig;

const Operations = ({ range }: { range: Range }) => {
  const ops = OPERATIONS[range];
  const openIncidents = INCIDENTS.filter((i) => i.status !== "resolved");
  const pending = APPROVALS.filter((a) => a.status === "pending");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-4 lg:col-span-3 xl:grid-cols-4">
        <StatCard
          label="Mean time to detect"
          value={formatDuration(ops.mttd)}
          icon={<ClockIcon />}
          trend={{ value: "18%", direction: "down", goodWhen: "down" }}
          hint="Log received → verdict"
        />
        <StatCard
          label="Mean time to respond"
          value={formatDuration(ops.mttr)}
          icon={<TimerIcon />}
          trend={{ value: "6%", direction: "up", goodWhen: "down" }}
          hint="Verdict → analyst decision"
        />
        <StatCard
          label="Handled by automation"
          value={percent(ops.automated)}
          icon={<BotIcon />}
          trend={{ value: "4 pts", direction: "up", goodWhen: "up" }}
          hint="Closed without analyst work"
        />
        <StatCard
          label="SLA met"
          value={percent(ops.slaMet)}
          icon={<ActivityIcon />}
          trend={{ value: "2 pts", direction: "down", goodWhen: "up" }}
          hint="Incidents answered in time"
        />
      </div>

      <Card title="Alert volume by severity" className="lg:col-span-2">
        <ChartContainer config={volumeChart} className="aspect-auto h-64 w-full">
          <BarChart data={ALERT_VOLUME[range]} margin={{ left: -20, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {(["low", "medium", "high", "critical"] as const).map((key, i, all) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={`var(--color-${key})`}
                radius={i === all.length - 1 ? [3, 3, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </Card>

      <Card
        title="Open incidents"
        action={
          <Link to="/incidents" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View <ArrowRightIcon className="size-3" />
          </Link>
        }
      >
        <ul className="space-y-1">
          {SEVERITIES.slice(0, 4).map((severity) => {
            const count = openIncidents.filter((i) => i.severity === severity).length;
            return (
              <li key={severity} className="flex items-center gap-2 py-1 text-sm">
                <SeverityDot severity={severity} />
                <span className="flex-1 text-muted-foreground">{severityLabel(severity)}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-2 border-t pt-3">
          {openIncidents.slice(0, 3).map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
              <span className="min-w-0 flex-1 truncate">{incident.title}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title="Waiting for approval"
        className="lg:col-span-2"
        action={
          <Link to="/approvals" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Review <ArrowRightIcon className="size-3" />
          </Link>
        }
      >
        <ul className="divide-y">
          {pending.map((approval) => (
            <li key={approval.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
              <span className="font-medium">{approval.action}</span>
              <span className="font-mono text-xs text-muted-foreground">{approval.target}</span>
              <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span>{ANALYSTS[approval.approver].name}</span>
                <span className="text-sev-medium">
                  expires <RelativeTime date={approval.expiresAt} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Playbook health"
        action={
          <Link to="/playbooks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View <ArrowRightIcon className="size-3" />
          </Link>
        }
      >
        <ul className="space-y-3">
          {PLAYBOOKS.map((playbook) => {
            const rate = playbook.stats?.successRate;
            const live = rate !== undefined;
            return (
              <li key={playbook.id} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-8 font-mono text-xs text-muted-foreground">{playbook.code}</span>
                  <span className={cn("min-w-0 flex-1 truncate", !live && "text-muted-foreground")}>
                    {playbook.name}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {live ? `${percent(rate)} success` : "Planned"}
                  </span>
                </div>
                {rate !== undefined && (
                  <div className="ml-10 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full origin-left rounded-full",
                        rate >= 0.95 ? "bg-success" : rate >= 0.9 ? "bg-sev-medium" : "bg-sev-high",
                      )}
                      style={{ transform: `scaleX(${rate})` }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
};