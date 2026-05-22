import type { ReactNode } from "react";

export type Role = "admin" | "agent" | "ambassador";

export interface LoginMeta {
  cls: "admin" | "agent" | "amb";
  icon: ReactNode;
  title: string;
  sub: string;
  sso: boolean;
  demoEmail: string;
  demoName: string;
  defaultScreen: string;
}

export const LOGIN_META: Record<Role, LoginMeta> = {
  admin: {
    cls: "admin",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    title: "Welcome back",
    sub: "Sign in to the ALX Rwanda admin workspace.",
    sso: true,
    demoEmail: "emmanuel@alxafrica.com",
    demoName: "Emmanuel Mugabo · Admin",
    defaultScreen: "/workspace/admin/dashboard",
  },
  agent: {
    cls: "agent",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.66 2.61a2 2 0 0 1-.45 2.11L8.1 9.66a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.83.32 1.71.54 2.61.66A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "Sign in to your agent workspace",
    sub: "Pick up today's deal queue, log outcomes, and track value earned.",
    sso: false,
    demoEmail: "kalisa@alxafrica.com",
    demoName: "Kalisa Eric · Call Agent",
    defaultScreen: "/workspace/agent/today",
  },
  ambassador: {
    cls: "amb",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Sign in to your ambassador workspace",
    sub: "Work your daily queue, host events, and grow the ALX community.",
    sso: false,
    demoEmail: "diane@alxafrica.com",
    demoName: "Diane Mutesi · Recruitment Lead",
    defaultScreen: "/workspace/ambassador/today",
  },
};

export const ROLES: readonly Role[] = ["admin", "agent", "ambassador"] as const;
