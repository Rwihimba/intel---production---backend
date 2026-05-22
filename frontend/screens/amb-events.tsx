import { EVENTS_BASE } from "@/lib/mock-data";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function countdown(d: string) {
  const ms = new Date(d).getTime() - TODAY.getTime();
  const days = Math.ceil(ms / (86400 * 1000));
  if (days > 0) return `In ${days} day${days === 1 ? "" : "s"}`;
  if (days === 0) return "Today";
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}

function stBadge(s: string) {
  if (s === "Upcoming") return <span className="badge blue">Upcoming</span>;
  if (s === "Completed") return <span className="badge green">Completed</span>;
  return <span className="badge muted">{s}</span>;
}

const PinIcon = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const CalIcon = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);

export function AmbEvents() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Events</h1>
          <div className="sub">
            {EVENTS_BASE.length} events · {EVENTS_BASE.filter((e) => e.status === "Upcoming").length} upcoming
          </div>
        </div>
        <button className="btn primary">+ Register Event</button>
      </div>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {EVENTS_BASE.map((ev) => {
          const pct = ev.actual != null ? Math.min(100, (ev.actual / ev.expected) * 100) : 0;
          const delta = ev.actual != null ? ev.actual - ev.expected : null;
          return (
            <div key={ev.name} className="event-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {stBadge(ev.status)}
                <span className="tiny" style={{ color: "var(--text3)" }}>
                  {countdown(ev.date)}
                </span>
              </div>
              <div className="name">{ev.name}</div>
              <div className="meta">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {PinIcon}
                  {ev.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {CalIcon}
                  {ev.date}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text2)",
                  marginBottom: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {ev.actual != null
                    ? `${ev.actual} / ${ev.expected} attended`
                    : `${ev.expected} expected`}
                </span>
                {delta != null && (
                  <span style={{ color: delta >= 0 ? "var(--green)" : "var(--red)" }}>
                    {delta >= 0 ? "+" : ""}
                    {delta}
                  </span>
                )}
              </div>
              <div className="progress thin">
                <i
                  style={{
                    width: `${ev.actual != null ? pct : 0}%`,
                    background:
                      ev.actual != null
                        ? (delta ?? 0) >= 0
                          ? "var(--green)"
                          : "var(--amber)"
                        : "var(--border)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
