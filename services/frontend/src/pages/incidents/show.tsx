import {
  BotIcon,
  CheckIcon,
  CircleDashedIcon,
  FileTextIcon,
  HourglassIcon,
  LoaderIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { AnalystAvatar } from "@/components/soar/avatar";
import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { SeverityBadge, SeverityDot } from "@/components/soar/severity";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { absoluteTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { alertNumber } from "@/pages/alerts/alert";
import {
  APPROVALS,
  INCIDENTS,
  LINKED_ALERTS,
  type IncidentStatus,
  type IncidentTask,
  type TimelineEvent,
} from "@/preview/data";
import { INCIDENT_STATUSES, SlaTimer } from "./shared";

export const IncidentShow = () => {
  const { id } = useParams();
  const incident = INCIDENTS.find((i) => i.id === id);
  const [status, setStatus] = useState<IncidentStatus | undefined>(incident?.status);
  const [owner, setOwner] = useState(incident?.owner ?? null);

  if (!incident || !status) {
    return (
      <>
        <PageHeader title="Incident" back={{ to: "/incidents", label: "Incidents" }} />
        <div className="rounded-xl border bg-card">
          <EmptyState title="Incident not found" description={`There is no incident ${id} in the sample data.`} />
        </div>
      </>
    );
  }

  const approvals = APPROVALS.filter((a) => a.incident === incident.id);
  const alerts = LINKED_ALERTS[incident.id] ?? [];

  const changeStatus = (next: IncidentStatus) => {
    setStatus(next);
    toast(`Status set to ${INCIDENT_STATUSES.find((s) => s.value === next)!.label}`, {
      description: "Preview only. Nothing is saved.",
    });
  };

  return (
    <>
      <PageHeader
        back={{ to: "/incidents", label: "Incidents" }}
        title={incident.title}
        meta={
          <>
            <span className="font-mono text-xs">{incident.id}</span>
            <SeverityBadge severity={incident.severity} />
            <span>
              Opened <RelativeTime date={incident.createdAt} />
            </span>
            <span>{incident.alerts} alerts</span>
          </>
        }
        actions={
          <>
            {owner !== "ap" && (
              <Button variant="outline" size="sm" onClick={() => setOwner("ap")}>
                <UserIcon />
                Assign to me
              </Button>
            )}
            <Select value={status} onValueChange={(v) => changeStatus(v as IncidentStatus)}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      <PreviewNotice>Incidents, owners and status changes are planned in the api.</PreviewNotice>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-medium">Summary</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
              {incident.summary}
            </p>
          </section>

          <Tabs defaultValue="timeline" className="gap-4">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline">
              <Timeline events={incident.timeline} />
            </TabsContent>
            <TabsContent value="tasks">
              <Tasks tasks={incident.tasks} />
            </TabsContent>
            <TabsContent value="alerts">
              <div className="overflow-hidden rounded-xl border bg-card">
                {alerts.length === 0 ? (
                  <EmptyState title="No linked alerts in the sample data" />
                ) : (
                  <ul className="divide-y">
                    {alerts.map((alert) => (
                      <li key={alert.number} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <SeverityDot severity={alert.severity} />
                        <span className="w-24 font-mono text-xs">{alertNumber(alert.number)}</span>
                        <span className="min-w-0 flex-1 truncate">{alert.title}</span>
                        <RelativeTime date={alert.at} className="text-xs text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border bg-card p-4">
            <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>
                <AnalystAvatar id={owner} showName />
              </dd>
              <dt className="text-muted-foreground">SLA</dt>
              <dd>
                <SlaTimer dueAt={incident.slaDueAt} resolved={status === "resolved"} />
              </dd>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="text-muted-foreground">{absoluteTime(incident.updatedAt)}</dd>
              <dt className="self-start text-muted-foreground">Hosts</dt>
              <dd className="flex flex-wrap gap-1">
                {incident.hosts.map((host) => (
                  <span key={host} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {host}
                  </span>
                ))}
              </dd>
              <dt className="self-start text-muted-foreground">ATT&amp;CK</dt>
              <dd className="flex flex-wrap gap-1">
                {incident.tactics.map((tactic) => (
                  <span key={tactic} className="rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {tactic}
                  </span>
                ))}
              </dd>
            </dl>
          </section>

          <section className="rounded-xl border bg-card">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-medium">Response actions</h2>
              <Link to="/approvals" className="text-xs text-muted-foreground hover:text-foreground">
                Approvals
              </Link>
            </header>
            {approvals.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">None requested.</p>
            ) : (
              <ul className="divide-y">
                {approvals.map((approval) => (
                  <li key={approval.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <ApprovalIcon status={approval.status} />
                    <div className="min-w-0">
                      <p className="font-medium">{approval.action}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{approval.target}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
};

const ApprovalIcon = ({ status }: { status: string }) => {
  const map = {
    pending: { icon: HourglassIcon, className: "text-sev-medium" },
    approved: { icon: CheckIcon, className: "text-success" },
    rejected: { icon: XIcon, className: "text-sev-critical" },
    expired: { icon: XIcon, className: "text-muted-foreground" },
  } as const;
  const { icon: Icon, className } = map[status as keyof typeof map];
  return <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />;
};

const EVENT_ICONS = {
  log: { icon: FileTextIcon, className: "bg-muted text-muted-foreground" },
  playbook: { icon: BotIcon, className: "bg-primary/15 text-primary" },
  analyst: { icon: UserIcon, className: "bg-sev-low/15 text-sev-low" },
  approval: { icon: ShieldCheckIcon, className: "bg-sev-medium/15 text-sev-medium" },
};

const Timeline = ({ events }: { events: TimelineEvent[] }) => (
  <ol className="rounded-xl border bg-card p-4">
    {events.map((event, i) => {
      const { icon: Icon, className } = EVENT_ICONS[event.kind];
      return (
        <li key={i} className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
          {i < events.length - 1 && (
            <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border" />
          )}
          <span className={cn("flex size-8 items-center justify-center rounded-full", className)}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium">{event.title}</p>
              <RelativeTime date={event.at} className="text-xs text-muted-foreground" />
            </div>
            {(event.host || event.lines) && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {event.host}
                {event.host && event.lines && " · "}
                {event.lines && `${/[–,]/.test(event.lines) ? "lines" : "line"} ${event.lines}`}
              </p>
            )}
            {event.detail && <p className="mt-1 text-sm text-pretty text-muted-foreground">{event.detail}</p>}
          </div>
        </li>
      );
    })}
  </ol>
);

const TASK_STATE = {
  done: { icon: CheckIcon, className: "bg-success text-primary-foreground", label: "Done" },
  running: { icon: LoaderIcon, className: "bg-sev-low/15 text-sev-low", label: "Running" },
  waiting: { icon: HourglassIcon, className: "bg-sev-medium/15 text-sev-medium", label: "Waiting" },
  todo: { icon: CircleDashedIcon, className: "text-muted-foreground", label: "To do" },
  failed: { icon: XIcon, className: "bg-sev-critical/15 text-sev-critical", label: "Failed" },
};

const Tasks = ({ tasks }: { tasks: IncidentTask[] }) => (
  <ul className="divide-y rounded-xl border bg-card">
    {tasks.map((task) => {
      const state = TASK_STATE[task.state];
      return (
        <li key={task.title} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", state.className)}>
            <state.icon className={cn("size-3.5", task.state === "running" && "animate-spin")} />
          </span>
          <span className={cn("min-w-0 flex-1", task.state === "todo" && "text-muted-foreground")}>
            {task.title}
          </span>
          {task.note && <span className="hidden text-xs text-muted-foreground sm:inline">{task.note}</span>}
          <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">{task.owner}</span>
        </li>
      );
    })}
  </ul>
);
