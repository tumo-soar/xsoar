import {
  BellRingIcon,
  BlocksIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  SirenIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** The screen runs on sample data until its backend exists. */
  preview?: boolean;
};

export type NavGroup = { label?: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { items: [{ to: "/overview", label: "Overview", icon: LayoutDashboardIcon }] },
  {
    label: "Respond",
    items: [
      { to: "/alerts", label: "Alerts", icon: BellRingIcon },
      { to: "/incidents", label: "Incidents", icon: SirenIcon, preview: true },
      { to: "/approvals", label: "Approvals", icon: ShieldCheckIcon, preview: true },
    ],
  },
  {
    label: "Automate",
    items: [{ to: "/playbooks", label: "Playbooks", icon: WorkflowIcon, preview: true }],
  },
  {
    label: "Investigate",
    items: [{ to: "/indicators", label: "Indicators", icon: FingerprintIcon, preview: true }],
  },
  {
    label: "Configure",
    items: [{ to: "/integrations", label: "Integrations", icon: BlocksIcon, preview: true }],
  },
];
