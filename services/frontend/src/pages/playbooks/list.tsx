import { ArrowRightIcon, BotIcon, NetworkIcon, WorkflowIcon } from "lucide-react";
import { Link } from "react-router";

import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { formatDuration, percent } from "@/lib/format";
import { PLAYBOOKS, type Playbook } from "@/preview/data";
import { PlaybookStatus } from "./shared";

const KIND_ICONS = { Orchestrator: NetworkIcon, AI: BotIcon, Automation: WorkflowIcon };

export const PlaybookList = () => {
  const [main, ...checks] = PLAYBOOKS;
  return (
    <>
      <PageHeader
        title="Playbooks"
        description="Each playbook is one self-contained check. The orchestrator decides which one runs next."
      />
      <PreviewNotice>
        Only AI alert validation (P01) runs today. Run counts are sample numbers.
      </PreviewNotice>

      <PlaybookCard playbook={main} featured />

      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>
    </>
  );
};

const PlaybookCard = ({ playbook, featured }: { playbook: Playbook; featured?: boolean }) => {
  const Icon = KIND_ICONS[playbook.kind];
  const { stats } = playbook;
  return (
    <Link
      to={`/playbooks/${playbook.id}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{playbook.code}</span>
            <h2 className="font-medium">{playbook.name}</h2>
            <PlaybookStatus status={playbook.status} />
          </div>
          <p className={featured ? "mt-1 max-w-3xl text-sm text-pretty text-muted-foreground" : "mt-1 line-clamp-2 text-sm text-pretty text-muted-foreground"}>
            {playbook.description}
          </p>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
      </div>
      <dl className="mt-auto grid grid-cols-3 gap-4 border-t pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Runs, 24h</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{stats ? stats.runs : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Success</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{stats ? percent(stats.successRate) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Average time</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{stats ? formatDuration(stats.avgSeconds) : "—"}</dd>
        </div>
      </dl>
    </Link>
  );
};
