import { ShieldHalfIcon } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { PreviewBadge } from "@/components/soar/preview";
import { APPROVALS } from "@/preview/data";
import { useRecentAlerts } from "@/pages/alerts/use-recent-alerts";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";

export function AppSidebar() {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const { result, query } = useRecentAlerts();

  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  const needsCheck = result.data.filter((a) => a.status === "MANUAL_CHECK_REQUIRED").length;
  const pendingApprovals = APPROVALS.filter((a) => a.status === "pending").length;
  const counts: Record<string, number> = {
    "/alerts": needsCheck,
    "/approvals": pendingApprovals,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <Link to="/overview" className="flex items-center gap-2.5 px-1.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldHalfIcon className="size-4" />
          </span>
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">X SOAR</span>
            <span className="text-[11px] text-muted-foreground">Security operations</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {NAV.map((group, i) => (
          <SidebarGroup key={group.label ?? i} className="py-1">
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                const count = counts[item.to];
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "relative text-sidebar-foreground/80",
                        "data-[active=true]:text-sidebar-accent-foreground",
                        "data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary",
                      )}
                    >
                      <Link to={item.to}>
                        <item.icon className={cn(active && "text-primary")} />
                        <span>{item.label}</span>
                        {item.preview && !count && (
                          <PreviewBadge className="ml-auto group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {!!count && (
                      <SidebarMenuBadge className="rounded-full bg-sev-medium/15 text-sev-medium tabular-nums">
                        {count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <ApiHealth loading={query.isLoading} error={query.isError} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ApiHealth({ loading, error }: { loading: boolean; error: boolean }) {
  const label = loading ? "Connecting to api" : error ? "api unreachable" : "api connected";
  return (
    <div
      className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-muted-foreground"
      title={import.meta.env.VITE_API_URL}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          loading && "live-dot bg-sev-info",
          !loading && error && "bg-sev-critical",
          !loading && !error && "bg-success",
        )}
      />
      <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
    </div>
  );
}
