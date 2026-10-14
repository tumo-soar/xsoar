import {
  BinaryIcon,
  CopyIcon,
  CpuIcon,
  FileIcon,
  FingerprintIcon,
  GlobeIcon,
  NetworkIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { EmptyState } from "@/components/soar/empty-state";
import { PageHeader } from "@/components/soar/page-header";
import { PreviewNotice } from "@/components/soar/preview";
import { RelativeTime } from "@/components/soar/relative-time";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { INDICATORS, type IndicatorType, type Reputation } from "@/preview/data";

const TYPES: { value: IndicatorType; label: string; icon: typeof GlobeIcon }[] = [
  { value: "ip", label: "IP", icon: NetworkIcon },
  { value: "domain", label: "Domain", icon: GlobeIcon },
  { value: "account", label: "Account", icon: UserIcon },
  { value: "file", label: "File", icon: FileIcon },
  { value: "process", label: "Process", icon: CpuIcon },
  { value: "hash", label: "Hash", icon: BinaryIcon },
];

const REPUTATION: Record<Reputation, { label: string; className: string }> = {
  malicious: { label: "Malicious", className: "bg-sev-critical/12 text-sev-critical" },
  suspicious: { label: "Suspicious", className: "bg-sev-high/12 text-sev-high" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground" },
  benign: { label: "Benign", className: "bg-success/12 text-success" },
};

export const IndicatorList = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<IndicatorType | null>(null);

  const query = search.trim().toLowerCase();
  const indicators = INDICATORS.filter((i) => !type || i.type === type).filter(
    (i) => !query || i.value.toLowerCase().includes(query),
  );

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Copied", { description: value });
  };

  return (
    <>
      <PageHeader
        title="Indicators"
        description="IPs, domains, accounts and files seen in evidence, with how often and where they appeared."
      />
      <PreviewNotice>
        Indicators are not stored yet. The alert page already lists the IPs and domains found in its evidence lines.
      </PreviewNotice>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex flex-wrap gap-1">
            <FilterChip active={type === null} onClick={() => setType(null)}>
              All
            </FilterChip>
            {TYPES.map((t) => (
              <FilterChip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                <t.icon className="size-3.5" />
                {t.label}
              </FilterChip>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search value"
              className="h-8 pl-8 font-mono text-xs"
            />
          </div>
        </div>

        {indicators.length === 0 ? (
          <EmptyState icon={<FingerprintIcon />} title="No indicators match" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                  <th>Value</th>
                  <th className="w-28">Reputation</th>
                  <th className="w-24 text-right">Sightings</th>
                  <th className="w-32">Last seen</th>
                  <th className="w-28">Incidents</th>
                  <th className="w-52">Source</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((indicator) => {
                  const typeInfo = TYPES.find((t) => t.value === indicator.type)!;
                  const reputation = REPUTATION[indicator.reputation];
                  return (
                    <tr key={indicator.value} className="border-b last:border-b-0 [&>td]:px-4 [&>td]:py-2.5">
                      <td>
                        <button
                          type="button"
                          onClick={() => copy(indicator.value)}
                          className="group flex max-w-full items-center gap-2 text-left"
                          title="Copy"
                        >
                          <typeInfo.icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate font-mono text-xs">{indicator.value}</span>
                          <CopyIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                        </button>
                      </td>
                      <td>
                        <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium", reputation.className)}>
                          {reputation.label}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{indicator.sightings.toLocaleString()}</td>
                      <td className="text-xs text-muted-foreground">
                        <RelativeTime date={indicator.lastSeen} />
                      </td>
                      <td>
                        {indicator.incidents.map((id) => (
                          <Link key={id} to={`/incidents/${id}`} className="font-mono text-xs hover:underline">
                            {id}
                          </Link>
                        ))}
                      </td>
                      <td className="truncate text-xs text-muted-foreground">{indicator.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
      active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);
