import {
  CheckIcon,
  FlagIcon,
  GitForkIcon,
  LoaderIcon,
  PlayIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
  SquareFunctionIcon,
  XIcon,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { alertNumber } from "@/pages/alerts/alert";
import { PLAYBOOK_RUNS, PLAYBOOKS, type PlaybookStep } from "@/preview/data";
import { PlaybookStatus } from "./shared";

export const PlaybookShow = () => {
  const { id } = useParams();
  const playbook = PLAYBOOKS.find((p) => p.id === id);

  if (!playbook) {
    return (
      <>
        <PageHeader title="Playbook" back={{ to: "/playbooks", label: "Playbooks" }} />
        <div className="rounded-xl border bg-card">
          <EmptyState title="Playbook not found" />
        </div>
      </>
    );
  }

  const live = playbook.status === "live";
  const queue = playbook.kind === "Orchestrator" ? "—" : `playbook.${playbook.id}`;

  return (
    <>
      <PageHeader
        back={{ to: "/playbooks", label: "Playbooks" }}
        title={playbook.name}
        description={playbook.description}
        meta={
          <>
            <span className="font-mono text-xs">{playbook.code}</span>
            <PlaybookStatus status={playbook.status} />
            {playbook.kind !== "Orchestrator" && <span>{playbook.kind}</span>}
            <span>runs in {playbook.worker}</span>
          </>
        }
      />
      {!live && <PreviewNotice>This playbook is described in the course brief and not built yet.</PreviewNotice>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border bg-card">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">Flow</h2>
          </header>
          <div className="p-6">
            {playbook.steps ? (
              <Flow steps={playbook.steps} />
            ) : (
              <p className="text-sm text-muted-foreground">The steps are not designed yet.</p>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border bg-card p-4">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Trigger</dt>
                <dd className="mt-0.5">{playbook.trigger}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Queue</dt>
                <dd className="mt-0.5 font-mono text-xs">{queue}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Input</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {playbook.inputs.map((input) => (
                    <span key={input} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {input}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Output</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {playbook.outputs.map((output) => (
                    <span key={output} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {output}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>
          {playbook.kind === "Orchestrator" && (
            <p className="px-1 text-xs text-pretty text-muted-foreground">
              Routing lives in{" "}
              <code className="font-mono break-all">services/orchestrator/src/xsoar_orchestrator/routing.py</code>.
              Today it sends every alert to P01 and stops.
            </p>
          )}
        </aside>
      </div>

      {live && (
        <section className="overflow-hidden rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Recent runs</h2>
            <span className="text-xs text-muted-foreground">Sample data</span>
          </header>
          <table className="w-full text-sm">
            <tbody>
              {PLAYBOOK_RUNS.map((run) => (
                <tr key={run.id} className="border-b last:border-b-0 [&>td]:px-4 [&>td]:py-2.5">
                  <td className="w-8">
                    <RunIcon status={run.status} />
                  </td>
                  <td className="w-28 font-mono text-xs">{alertNumber(run.alert)}</td>
                  <td className="text-muted-foreground">{run.note ?? (run.status === "running" ? "Running…" : "")}</td>
                  <td className="w-24 text-right text-xs tabular-nums text-muted-foreground">
                    {formatDuration(run.seconds)}
                  </td>
                  <td className="w-32 text-right text-xs text-muted-foreground">
                    <RelativeTime date={run.startedAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
};

const RunIcon = ({ status }: { status: "ok" | "failed" | "running" }) => {
  if (status === "running") return <LoaderIcon className="size-4 animate-spin text-sev-low" />;
  if (status === "failed") return <XIcon className="size-4 text-sev-critical" />;
  return <CheckIcon className="size-4 text-success" />;
};

const STEP_ICONS = {
  start: PlayIcon,
  check: SearchCheckIcon,
  playbook: SquareFunctionIcon,
  parallel: GitForkIcon,
  approval: ShieldCheckIcon,
  end: FlagIcon,
};

const Flow = ({ steps }: { steps: PlaybookStep[] }) => (
  <ol className="mx-auto flex max-w-2xl flex-col items-stretch">
    {steps.map((step, i) => {
      const Icon = STEP_ICONS[step.kind];
      return (
        <li key={step.id} className="flex flex-col items-center">
          {i > 0 && <span aria-hidden className="h-6 w-px bg-border" />}
          {step.kind === "parallel" && step.branches ? (
            <div className="w-full rounded-xl border border-dashed p-3">
              <p className="mb-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" />
                {step.title}, in parallel
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {step.branches.map((branch) => (
                  <Link
                    key={branch.id}
                    to={`/playbooks/${branch.id}`}
                    className={cn(
                      "rounded-lg border bg-background p-3 transition-colors hover:border-foreground/20",
                      branch.live && "border-success/40",
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {branch.live && <span className="live-dot size-1.5 rounded-full bg-success" />}
                      {branch.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{branch.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "flex w-full max-w-sm items-start gap-3 rounded-lg border bg-background p-3",
                step.kind === "approval" && "border-sev-medium/40 bg-sev-medium/5",
                (step.kind === "start" || step.kind === "end") && "rounded-full px-4",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0 text-muted-foreground",
                  step.kind === "approval" && "text-sev-medium",
                  step.kind === "start" && "text-primary",
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                {step.detail && <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{step.detail}</p>}
              </div>
            </div>
          )}
        </li>
      );
    })}
  </ol>
);
