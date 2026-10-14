import { SearchIcon, SirenIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { AnalystAvatar } from "@/components/soar/avatar";
import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { SeverityBadge, SeverityStrip } from "@/components/soar/severity";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { INCIDENTS, type IncidentStatus } from "@/preview/data";
import { INCIDENT_STATUSES, IncidentStatusBadge, SlaTimer } from "./shared";

type Filter = "open" | IncidentStatus;

export const IncidentList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("open");
  const [search, setSearch] = useState("");

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: "open", label: "Open", count: INCIDENTS.filter((i) => i.status !== "resolved").length },
    ...INCIDENT_STATUSES.map((s) => ({
      value: s.value,
      label: s.label,
      count: INCIDENTS.filter((i) => i.status === s.value).length,
    })),
  ];

  const query = search.trim().toLowerCase();
  const incidents = INCIDENTS.filter((i) =>
    filter === "open" ? i.status !== "resolved" : i.status === filter,
  ).filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query) ||
      i.id.toLowerCase().includes(query) ||
      i.hosts.some((h) => h.includes(query)),
  );

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Related alerts grouped into one case with an owner, a deadline and a record of what was done."
      />
      <PreviewNotice>
        Grouping alerts into incidents is planned in the orchestrator (<code className="font-mono text-xs">grouping.py</code>).
      </PreviewNotice>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex flex-wrap gap-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
                  filter === tab.value
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span className="text-xs text-muted-foreground tabular-nums">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, ID or host"
              className="h-8 pl-8"
            />
          </div>
        </div>

        {incidents.length === 0 ? (
          <EmptyState icon={<SirenIcon />} title="No incidents match" description="Try another tab or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                  <th className="w-28">Severity</th>
                  <th>Incident</th>
                  <th className="w-32">Status</th>
                  <th className="w-16">Owner</th>
                  <th className="w-20 text-right">Alerts</th>
                  <th className="w-44">SLA</th>
                  <th className="w-32 text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/40 [&>td]:px-4 [&>td]:py-3 [&>td]:align-top"
                  >
                    <td className="relative">
                      <SeverityStrip severity={incident.severity} />
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td>
                      <div className="flex items-baseline gap-2">
                        <Link
                          to={`/incidents/${incident.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 font-mono text-xs text-muted-foreground hover:underline"
                        >
                          {incident.id}
                        </Link>
                        <span className="truncate font-medium">{incident.title}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {incident.hosts.join(", ")} · {incident.tactics.join(", ")}
                      </p>
                    </td>
                    <td>
                      <IncidentStatusBadge status={incident.status} />
                    </td>
                    <td>
                      <AnalystAvatar id={incident.owner} />
                    </td>
                    <td className="text-right tabular-nums">{incident.alerts}</td>
                    <td>
                      <SlaTimer dueAt={incident.slaDueAt} resolved={incident.status === "resolved"} className="text-xs whitespace-nowrap" />
                    </td>
                    <td className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      <RelativeTime date={incident.updatedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
