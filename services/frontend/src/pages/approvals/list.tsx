import { CheckIcon, HourglassIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { AnalystAvatar } from "@/components/soar/avatar";
import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ANALYSTS, APPROVALS, type Approval, type ApprovalStatus } from "@/preview/data";

const ME = "ap";

const RULES = [
  "Only the named approver can approve, and only this exact action.",
  "A rejected or expired request is never executed.",
  "An approved change does not cover new actions. Shutting down a system needs its own approval.",
  "Every answer is stored with the approver, the decision and the time.",
];

export const ApprovalList = () => {
  const [approvals, setApprovals] = useState(APPROVALS);
  const [tab, setTab] = useState<"pending" | "decided">("pending");
  // Cards decided on this visit stay in the Waiting tab until it is left, so the result shows in place.
  const [justDecided, setJustDecided] = useState<string[]>([]);

  const switchTab = (next: "pending" | "decided") => {
    setTab(next);
    setJustDecided([]);
  };

  const decide = (id: string, status: Extract<ApprovalStatus, "approved" | "rejected">, comment?: string) => {
    setJustDecided((ids) => [...ids, id]);
    setApprovals((list) =>
      list.map((a) =>
        a.id === id ? { ...a, status, decidedBy: ME, decidedAt: new Date().toISOString(), comment } : a,
      ),
    );
    const approval = approvals.find((a) => a.id === id)!;
    toast(status === "approved" ? `Approved: ${approval.action}` : `Rejected: ${approval.action}`, {
      description: "Preview only. No action was run.",
    });
  };

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");
  const shown =
    tab === "pending"
      ? approvals.filter((a) => a.status === "pending" || justDecided.includes(a.id))
      : decided;

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Response actions that change a system wait here until the responsible person approves them."
      />
      <PreviewNotice>
        Approval requests come from the Change approval playbook (P02), which is planned.
      </PreviewNotice>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="inline-flex w-fit rounded-lg border bg-muted/40 p-0.5 text-sm" role="tablist">
            {(
              [
                ["pending", "Waiting", pending.length],
                ["decided", "Decided", decided.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => switchTab(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors",
                  tab === value ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={<ShieldCheckIcon />}
                title={tab === "pending" ? "Nothing is waiting for approval" : "No decisions yet"}
              />
            </div>
          ) : (
            shown.map((approval) => <ApprovalCard key={approval.id} approval={approval} onDecide={decide} />)
          )}
        </div>

        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium">How approvals work</h2>
          <ul className="mt-3 space-y-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm text-muted-foreground">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                {rule}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
};

const ApprovalCard = ({
  approval,
  onDecide,
}: {
  approval: Approval;
  onDecide: (id: string, status: "approved" | "rejected", comment?: string) => void;
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const isMine = approval.approver === ME;

  return (
    <article className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{approval.action}</h3>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{approval.target}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link to={`/incidents/${approval.incident}`} className="font-mono hover:text-foreground hover:underline">
              {approval.incident}
            </Link>
            {" · "}
            {approval.requestedBy}
            {" · "}
            <RelativeTime date={approval.requestedAt} />
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{approval.id}</span>
      </div>

      <dl className="grid gap-x-6 gap-y-3 border-t px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Why</dt>
          <dd className="mt-0.5 text-pretty">{approval.reason}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Impact</dt>
          <dd className="mt-0.5 text-pretty">{approval.impact}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <AnalystAvatar id={approval.approver} />
          <span>
            {isMine ? "You approve this" : `${ANALYSTS[approval.approver].name} approves this`}
          </span>
        </div>

        {approval.status === "pending" ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-sev-medium">
              <HourglassIcon className="size-3.5" />
              Expires <RelativeTime date={approval.expiresAt} />
            </span>
            {isMine && !rejecting && (
              <>
                <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
                  <XIcon />
                  Reject
                </Button>
                <Button size="sm" onClick={() => onDecide(approval.id, "approved")}>
                  <CheckIcon />
                  Approve
                </Button>
              </>
            )}
          </div>
        ) : (
          <Decision approval={approval} />
        )}
      </div>

      {rejecting && approval.status === "pending" && (
        <div className="flex flex-col gap-2 border-t px-4 py-3">
          <Textarea
            autoFocus
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Why is this rejected? The playbook will not run the action."
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!comment.trim()}
              onClick={() => onDecide(approval.id, "rejected", comment.trim())}
            >
              Reject action
            </Button>
          </div>
        </div>
      )}
    </article>
  );
};

const DECISION = {
  approved: { icon: CheckIcon, label: "Approved", className: "text-success" },
  rejected: { icon: XIcon, label: "Rejected, not executed", className: "text-sev-critical" },
  expired: { icon: HourglassIcon, label: "Expired, not executed", className: "text-muted-foreground" },
};

const Decision = ({ approval }: { approval: Approval }) => {
  const decision = DECISION[approval.status as keyof typeof DECISION];
  return (
    <div
      className={cn(
        "flex flex-col items-end gap-0.5 text-right",
        "transition-[opacity,filter] duration-200 ease-out starting:opacity-0 starting:blur-[2px]",
      )}
    >
      <span className={cn("flex items-center gap-1 text-sm font-medium", decision.className)}>
        <decision.icon className="size-4" />
        {decision.label}
      </span>
      {approval.decidedBy && approval.decidedAt && (
        <span className="text-xs text-muted-foreground">
          {ANALYSTS[approval.decidedBy].name} · <RelativeTime date={approval.decidedAt} />
        </span>
      )}
      {approval.comment && <span className="max-w-xs text-xs text-pretty text-muted-foreground">“{approval.comment}”</span>}
    </div>
  );
};
