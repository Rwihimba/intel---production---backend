import Link from "next/link";

const roles = [
  {
    href: "/admin-login",
    cls: "admin",
    title: "Admin",
    sub: "ALX Staff · Configure programs, approve deals, manage targets",
    meta: "@alxafrica.com",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/login?role=agent",
    cls: "agent",
    title: "Agent",
    sub: "Call Agent · Execute daily deal queue, log outcomes, earn value",
    meta: "Deal execution",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.66 2.61a2 2 0 0 1-.45 2.11L8.1 9.66a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.83.32 1.71.54 2.61.66A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: "/login?role=ambassador",
    cls: "amb",
    title: "Ambassador",
    sub: "Recruitment Lead · Convert leads, host events, grow community",
    meta: "Events & conversion",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
] as const;

export default function RoleSelectPage() {
  return (
    <div className="role-screen">
      <div className="heading">
        <h1>INTEL — Select your workspace</h1>
        <div className="sub">ALX Rwanda Operations Intelligence System</div>
      </div>
      <div className="role-cards">
        {roles.map((r) => (
          <Link key={r.cls} href={r.href} className={`role-card ${r.cls}`}>
            <div className="icon">{r.icon}</div>
            <div>
              <h3>{r.title}</h3>
              <div className="role-sub">{r.sub}</div>
            </div>
            <div className="role-meta">{r.meta}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
