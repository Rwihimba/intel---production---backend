"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Role = "admin" | "agent" | "ambassador";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const SVG_BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON: Record<string, ReactNode> = {
  grid: (
    <svg {...SVG_BASE}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  alert: (
    <svg {...SVG_BASE}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  "chart-bar": (
    <svg {...SVG_BASE}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  target: (
    <svg {...SVG_BASE}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  trophy: (
    <svg {...SVG_BASE}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  users: (
    <svg {...SVG_BASE}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  "check-circle": (
    <svg {...SVG_BASE}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  sliders: (
    <svg {...SVG_BASE}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  "file-text": (
    <svg {...SVG_BASE}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="11" y2="9" />
    </svg>
  ),
  upload: (
    <svg {...SVG_BASE}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  clock: (
    <svg {...SVG_BASE}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  book: (
    <svg {...SVG_BASE}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  layers: (
    <svg {...SVG_BASE}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  handshake: (
    <svg {...SVG_BASE}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  message: (
    <svg {...SVG_BASE}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "user-cog": (
    <svg {...SVG_BASE}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg {...SVG_BASE}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  phone: (
    <svg {...SVG_BASE}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.66 2.61a2 2 0 0 1-.45 2.11L8.1 9.66a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.83.32 1.71.54 2.61.66A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  "dollar-sign": (
    <svg {...SVG_BASE}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 1.5 1 2 2.5 2.5s2.5 1 2.5 2.5a2.5 2.5 0 0 1-5 0" />
      <line x1="12" y1="7" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="17" />
    </svg>
  ),
  calendar: (
    <svg {...SVG_BASE}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  "plus-circle": (
    <svg {...SVG_BASE}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  logout: (
    <svg {...SVG_BASE}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/workspace/admin", icon: ICON.grid },
    { label: "Alerts", href: "/workspace/admin/alerts", icon: ICON.alert },
    { label: "Metrics", href: "/workspace/admin/metrics", icon: ICON["chart-bar"] },
    { label: "Targets", href: "/workspace/admin/targets", icon: ICON.target },
    { label: "Performance", href: "/workspace/admin/performance", icon: ICON.trophy },
    { label: "Learners", href: "/workspace/admin/learners", icon: ICON.users },
    { label: "Approvals", href: "/workspace/admin/approvals", icon: ICON["check-circle"] },
    { label: "Distribution", href: "/workspace/admin/distribution", icon: ICON.sliders },
    { label: "Reports", href: "/workspace/admin/reports", icon: ICON["file-text"] },
    { label: "Upload", href: "/workspace/admin/upload", icon: ICON.upload },
    { label: "Upload History", href: "/workspace/admin/upload-history", icon: ICON.clock },
    { label: "Programs", href: "/workspace/admin/programs", icon: ICON.book },
    { label: "Courses", href: "/workspace/admin/courses", icon: ICON.layers },
    { label: "Partnerships", href: "/workspace/admin/partnerships", icon: ICON.handshake },
    { label: "Nudges", href: "/workspace/admin/nudges", icon: ICON.message },
    { label: "Users", href: "/workspace/admin/users", icon: ICON["user-cog"] },
    { label: "Settings", href: "/workspace/admin/settings", icon: ICON.settings },
  ],
  agent: [
    { label: "My Deals", href: "/workspace/agent", icon: ICON.phone },
    { label: "History", href: "/workspace/agent/history", icon: ICON.clock },
    { label: "Performance", href: "/workspace/agent/performance", icon: ICON["chart-bar"] },
    { label: "Value Earned", href: "/workspace/agent/value", icon: ICON["dollar-sign"] },
  ],
  ambassador: [
    { label: "My Deals", href: "/workspace/ambassador", icon: ICON.phone },
    { label: "History", href: "/workspace/ambassador/history", icon: ICON.clock },
    { label: "Events", href: "/workspace/ambassador/events", icon: ICON.calendar },
    { label: "Register Event", href: "/workspace/ambassador/register-event", icon: ICON["plus-circle"] },
    { label: "Performance", href: "/workspace/ambassador/performance", icon: ICON["chart-bar"] },
  ],
};

function isActive(itemHref: string, currentPath: string): boolean {
  if (
    itemHref === "/workspace/admin" ||
    itemHref === "/workspace/agent" ||
    itemHref === "/workspace/ambassador"
  ) {
    return currentPath === itemHref;
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}

export function FloatingNav({
  role,
  currentPath,
}: {
  role: Role;
  currentPath: string;
}) {
  const items = NAV[role];
  const { signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const workspace = document.querySelector(".workspace");
    if (workspace) workspace.classList.toggle("rail-expanded", expanded);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    function onDocClick(e: MouseEvent) {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [expanded]);

  function onLinkClick(e: React.MouseEvent, href: string) {
    e.stopPropagation();
    if (!expanded) {
      e.preventDefault();
      setExpanded(true);
      return;
    }
    if (currentPath === href) {
      e.preventDefault();
      setExpanded(false);
    }
  }

  async function onSignOut(e: React.MouseEvent) {
    e.stopPropagation();
    if (!expanded) {
      setExpanded(true);
      return;
    }
    await signOut();
  }

  return (
    <aside
      ref={railRef}
      className={`nav-rail${expanded ? " expanded" : ""}`}
      onClick={() => {
        if (!expanded) setExpanded(true);
      }}
    >
      <div className="nr-scroll">
        {items.map((it) => {
          const active = isActive(it.href, currentPath);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`nr-link${active ? " active" : ""}`}
              onClick={(e) => onLinkClick(e, it.href)}
            >
              {it.icon}
              <span className="nr-label">{it.label}</span>
              <span className="nr-tip">{it.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="nr-foot">
        <button
          type="button"
          className="nr-link"
          onClick={onSignOut}
        >
          {ICON.logout}
          <span className="nr-label">Sign out</span>
          <span className="nr-tip">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
