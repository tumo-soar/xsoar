import { useTable } from "@refinedev/core";
import {
  BellOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  ServerCrashIcon,
  UploadIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { RelativeTime } from "@/components/soar/relative-time";
import {
  SEVERITIES,
  SeverityBadge,
  SeverityDot,
  SeverityStrip,
  severityLabel,
} from "@/components/soar/severity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type Alert, REFRESH_MS, alertNumber, alertSeverity, isInProgress } from "./alert";
import { StatusBadge } from "./status-badge";
import { useRecentAlerts } from "./use-recent-alerts";
import { ConfidenceMeter, VerdictLabel } from "./verdict";

const PAGE_SIZE = 20;

export const AlertList = () => {
  const navigate = useNavigate();
  const { result, tableQuery, currentPage, setCurrentPage, pageCount } = useTable<Alert>({
    resource: "alerts",
    pagination: { pageSize: PAGE_SIZE },
    syncWithLocation: true,
    errorNotification: false,
    queryOptions: {
      refetchInterval: (query) =>
        query.state.data?.data.some((a) => isInProgress(a.status)) ? REFRESH_MS : false,
    },
  });

  const alerts = result.data;
  const total = result.total ?? 0;
  const live = alerts.some((a) => isInProgress(a.status));
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Every log sent to X SOAR, newest first. AI alert validation runs on each one automatically."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tableQuery.refetch()}
              disabled={tableQuery.isFetching}
            >
              <RefreshCwIcon className={cn(tableQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      <SeverityCounts />

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {tableQuery.isLoading ? "Loading…" : total > 0 ? `${from}–${to} of ${total}` : "No alerts"}
          </span>
          {live && (
            <span className="flex items-center gap-1.5">
              <span className="live-dot size-1.5 rounded-full bg-sev-low" />
              Refreshing while analysis runs
            </span>
          )}
        </div>

        {tableQuery.isError ? (
          <EmptyState
            icon={<ServerCrashIcon />}
            title="Can't reach the api"
            description={
              <>
                Alerts are read from <code className="font-mono text-xs">{import.meta.env.VITE_API_URL ?? "VITE_API_URL"}</code>.
                Start the stack with <code className="font-mono text-xs">docker compose -f docker-compose-dev.yml up</code>.
              </>
            }
            action={
              <Button variant="outline" size="sm" onClick={() => tableQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : tableQuery.isLoading ? (
          <LoadingRows />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<BellOffIcon />}
            title="No alerts yet"
            description="Upload a log to see the AI analysis. The repository has examples in samples/."
            action={
              <Button asChild size="sm">
                <Link to="/alerts/create">
                  <UploadIcon />
                  Upload log
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                  <th className="w-28">Severity</th>
                  <th>Alert</th>
                  <th className="w-36">Verdict</th>
                  <th className="w-44">Status</th>
                  <th className="w-64">Source</th>
                  <th className="w-36 text-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onOpen={() => navigate(`/alerts/show/${alert.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-end gap-2 border-t px-4 py-2.5">
            <span className="mr-2 text-xs text-muted-foreground tabular-nums">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRightIcon />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

const AlertRow = ({ alert, onOpen }: { alert: Alert; onOpen: () => void }) => {
  const severity = alertSeverity(alert);
  const { report } = alert;
  const headline =
    report?.summary ??
    (alert.error
      ? alert.error
      : isInProgress(alert.status)
        ? "Waiting for AI analysis…"
        : (alert.filename ?? "No summary"));

  return (
    <tr
      onClick={onOpen}
      className="relative cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/40 [&>td]:px-4 [&>td]:py-3 [&>td]:align-top"
    >
      <td className="relative">
        <SeverityStrip severity={severity} />
        <SeverityBadge severity={severity} />
      </td>
      <td>
        <Link
          to={`/alerts/show/${alert.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs font-medium hover:underline"
        >
          {alertNumber(alert.number)}
        </Link>
        <p
          className={cn(
            "mt-0.5 truncate",
            !report?.summary && "text-muted-foreground",
            alert.error && "text-sev-medium",
          )}
        >
          {headline}
        </p>
      </td>
      <td>
        {report ? (
          <div className="space-y-1">
            <VerdictLabel verdict={report.verdict} />
            <ConfidenceMeter value={report.confidence} verdict={report.verdict} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td>
        <StatusBadge status={alert.status} />
      </td>
      <td>
        <div className="truncate text-muted-foreground" title={alert.filename ?? alert.source}>
          {alert.source}
          {alert.filename && <span className="text-foreground/80"> · {alert.filename}</span>}
        </div>
        {Object.keys(alert.labels).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(alert.labels).map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {key}={value}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="text-right whitespace-nowrap text-muted-foreground">
        <RelativeTime date={alert.received_at} />
      </td>
    </tr>
  );
};

const SeverityCounts = () => {
  const { result, query } = useRecentAlerts();
  if (query.isError || query.isLoading) return null;

  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  for (const alert of result.data) counts[alertSeverity(alert)]++;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-5">
      {SEVERITIES.map((severity) => (
        <div
          key={severity}
          className="flex items-center justify-between gap-2 bg-card px-4 py-3 last:col-span-2 sm:last:col-span-1"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <SeverityDot severity={severity} />
            {severityLabel(severity)}
          </span>
          <span className="text-lg font-semibold tabular-nums">{counts[severity]}</span>
        </div>
      ))}
    </div>
  );
};

const LoadingRows = () => (
  <div className="divide-y">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex items-center gap-6 px-4 py-4">
        <Skeleton className="h-5 w-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    ))}
  </div>
);
