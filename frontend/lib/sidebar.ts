import type { IconKey } from "./icons";
import type { Role } from "./login-meta";

export type SidebarItem =
  | { kind: "group"; label: string }
  | {
      kind: "link";
      key: string;
      href: string;
      label: string;
      icon: IconKey;
      count?: number;
    };

export interface RoleSidebar {
  items: SidebarItem[];
  showProgramToggle?: boolean;
  defaultHref: string;
}

export const ROLE_SIDEBARS: Record<Role, RoleSidebar> = {
  admin: {
    showProgramToggle: true,
    defaultHref: "/workspace/admin/dashboard",
    items: [
      { kind: "group", label: "Overview" },
      { kind: "link", key: "admin-dashboard", href: "/workspace/admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { kind: "link", key: "admin-alerts", href: "/workspace/admin/alerts", label: "Alert Centre", icon: "alert", count: 6 },
      { kind: "group", label: "Analytics" },
      { kind: "link", key: "admin-metrics", href: "/workspace/admin/metrics", label: "Metrics Dashboard", icon: "metrics" },
      { kind: "link", key: "admin-targets", href: "/workspace/admin/targets", label: "Target Dashboard", icon: "target" },
      { kind: "link", key: "admin-performance", href: "/workspace/admin/performance", label: "Performance", icon: "trendup" },
      { kind: "group", label: "Learners" },
      { kind: "link", key: "admin-learners", href: "/workspace/admin/learners", label: "Learners", icon: "users", count: 14 },
      { kind: "group", label: "Operations" },
      { kind: "link", key: "admin-approvals", href: "/workspace/admin/approvals", label: "Deal Approval", icon: "checksquare", count: 12 },
      { kind: "link", key: "admin-distribution", href: "/workspace/admin/distribution", label: "Deal Distribution", icon: "sliders" },
      { kind: "link", key: "admin-dealreports", href: "/workspace/admin/dealreports", label: "Deal Reports", icon: "report" },
      { kind: "link", key: "admin-upload", href: "/workspace/admin/upload", label: "Upload Centre", icon: "upload" },
      { kind: "link", key: "admin-uploadhist", href: "/workspace/admin/uploadhist", label: "Upload History", icon: "clock" },
      { kind: "group", label: "Programs" },
      { kind: "link", key: "admin-programs", href: "/workspace/admin/programs", label: "Program Setup", icon: "book" },
      { kind: "link", key: "admin-courses", href: "/workspace/admin/courses", label: "Course Manager", icon: "layers" },
      { kind: "group", label: "Partnerships" },
      { kind: "link", key: "admin-partnerships", href: "/workspace/admin/partnerships", label: "Partnership Tracker", icon: "link" },
      { kind: "group", label: "Configuration" },
      { kind: "link", key: "admin-nudges", href: "/workspace/admin/nudges", label: "Nudge Templates", icon: "message" },
      { kind: "link", key: "admin-users", href: "/workspace/admin/users", label: "User Management", icon: "user" },
      { kind: "link", key: "admin-settings", href: "/workspace/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
  agent: {
    defaultHref: "/workspace/agent/today",
    items: [
      { kind: "group", label: "My Work" },
      { kind: "link", key: "agent-today", href: "/workspace/agent/today", label: "Today's Deals", icon: "calendar", count: 10 },
      { kind: "link", key: "agent-history", href: "/workspace/agent/history", label: "Deal History", icon: "clock" },
      { kind: "group", label: "My Performance" },
      { kind: "link", key: "agent-perf", href: "/workspace/agent/performance", label: "Summary", icon: "trendup" },
      { kind: "link", key: "agent-value", href: "/workspace/agent/value", label: "Value Earned", icon: "coin" },
    ],
  },
  ambassador: {
    defaultHref: "/workspace/ambassador/today",
    items: [
      { kind: "group", label: "My Work" },
      { kind: "link", key: "amb-today", href: "/workspace/ambassador/today", label: "Today's Deals", icon: "calendar", count: 6 },
      { kind: "link", key: "amb-history", href: "/workspace/ambassador/history", label: "Deal History", icon: "clock" },
      { kind: "group", label: "My Events" },
      { kind: "link", key: "amb-events", href: "/workspace/ambassador/events", label: "Event List", icon: "calendar" },
      { kind: "link", key: "amb-register", href: "/workspace/ambassador/register", label: "Register Event", icon: "pluscircle" },
      { kind: "group", label: "My Performance" },
      { kind: "link", key: "amb-perf", href: "/workspace/ambassador/performance", label: "Summary", icon: "trendup" },
    ],
  },
};

export const ROLE_PROFILE: Record<
  Role,
  { initials: string; name: string; gradient: string }
> = {
  admin: { initials: "EM", name: "Emmanuel M.", gradient: "linear-gradient(135deg,#3B7DD8,#2A5BA8)" },
  agent: { initials: "KE", name: "Kalisa Eric", gradient: "linear-gradient(135deg,#00A896,#018e7c)" },
  ambassador: { initials: "DM", name: "Diane Mutesi", gradient: "linear-gradient(135deg,#D97706,#a85a02)" },
};
