import { LineChart } from "@/components/line-chart";
import {
  AT_RISK_METRICS,
  ENROLL_SERIES,
  PAY_SERIES,
  PENDING_APPROVALS_DASHBOARD,
  RECENT_DEALS,
  avatarColor,
  dealTypeClass,
  dealTypeLabel,
  fmt,
  initials,
} from "@/lib/mock-data";

interface Kpi {
  label: string;
  value: number;
  target: number;
  pct: number;
  delta: string;
  up: boolean;
  unit?: string;
}

const KPIS: Kpi[] = [
  {
    label: "Enrolled",
    value: 4821,
    target: 13000,
    pct: 4821 / 13000,
    delta: "+8.2%",
    up: true,
  },
  {
    label: "Paid",
    value: 187,
    target: 600,
    pct: 187 / 600,
    delta: "+5.4%",
    up: true,
  },
  {
    label: "Conversion",
    value: 38,
    target: 60,
    pct: 38 / 60,
    delta: "-2.1%",
    up: false,
    unit: "%",
  },
  {
    label: "Activation",
    value: 61,
    target: 90,
    pct: 61 / 90,
    delta: "+1.8%",
    up: true,
    unit: "%",
  },
  {
    label: "Graduation",
    value: 42,
    target: 70,
    pct: 42 / 70,
    delta: "+3.6%",
    up: true,
    unit: "%",
  },
];

function severityColor(pct: number): string {
  if (pct >= 0.8) return "var(--green)";
  if (pct >= 0.5) return "var(--amber)";
  return "var(--red)";
}

const MailIcon = (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const PhoneIcon = (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.66 2.61a2 2 0 0 1-.45 2.11L8.1 9.66a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.83.32 1.71.54 2.61.66A2 2 0 0 1 22 16.92z" />
  </svg>
);

function OutcomeBadge({ outcome }: { outcome: "Success" | "Pending" | "Rejected" }) {
  if (outcome === "Success")
    return (
      <span className="badge green">
        <span className="dot" />
        Success
      </span>
    );
  if (outcome === "Pending")
    return (
      <span className="badge amber">
        <span className="dot" />
        Pending
      </span>
    );
  return (
    <span className="badge red">
      <span className="dot" />
      Rejected
    </span>
  );
}

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function AdminDashboard() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Good morning, Emmanuel.</h1>
          <div className="sub">Both programs · {formattedDate}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="alert-pill">
            <span className="blip" />
            <span>
              Conversion at <b>38%</b> — target <b>60%</b>.
            </span>
            <a>Take action →</a>
          </div>
          <button className="btn">View targets</button>
          <button className="btn primary">Review approvals</button>
        </div>
      </div>

      <div className="date-range">
        <span className="dr-lbl">Viewing data from</span>
        <input type="date" defaultValue="2026-04-19" />
        <span className="dr-sep">to</span>
        <input type="date" defaultValue="2026-05-19" />
        <div className="dr-quick">
          {[
            ["7d", "Last 7d"],
            ["30d", "Last 30d"],
            ["90d", "Last 90d"],
            ["ytd", "YTD"],
          ].map(([k, l]) => (
            <button key={k} className={k === "30d" ? "active" : ""}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="kpi">
            <div className="label">{k.label}</div>
            <div className="value">
              {fmt(k.value)}
              {k.unit ?? ""}
            </div>
            <div className="target-line">
              of {fmt(k.target)}
              {k.unit ?? ""} target
            </div>
            <div className="bar progress thin">
              <i
                style={{
                  width: `${Math.min(100, Math.round(k.pct * 100))}%`,
                  background: severityColor(k.pct),
                }}
              />
            </div>
            <div className="row-end">
              <span className="pct">{Math.round(k.pct * 100)}% of target</span>
              <span className={`t-delta ${k.up ? "up" : "down"}`}>
                <span className="tri">{k.up ? "▲" : "▼"}</span>
                {k.delta.replace(/^[+\-]/, "")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Enrollment vs. Payments</div>
              <div className="card-sub">Last 8 weeks</div>
            </div>
            <div className="badge teal">Updated 4m ago</div>
          </div>
          <LineChart
            series={[
              { label: "Enrolled", color: "var(--teal)", values: ENROLL_SERIES },
              { label: "Paid", color: "var(--blue)", values: PAY_SERIES },
            ]}
            labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]}
            yMax={Math.max(...ENROLL_SERIES, 600)}
          />
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-h">
            <div>
              <div className="card-title">Deal activity</div>
              <div className="card-sub">Last 8 deals across all agents</div>
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 360 }}>
            {RECENT_DEALS.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  className="av"
                  style={{ background: avatarColor(d.agent), marginTop: 2 }}
                >
                  {initials(d.agent)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.learner}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9AA3B2",
                      marginTop: 3,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {MailIcon}
                      {d.email}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {PhoneIcon}
                      {d.phone}
                    </span>
                  </div>
                  <div className="tiny" style={{ marginTop: 4 }}>
                    {d.agent}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <span className={`dt ${dealTypeClass(d.type)}`}>
                    {dealTypeLabel(d.type)}
                  </span>
                  <OutcomeBadge outcome={d.outcome} />
                </div>
                <div
                  className="tiny"
                  style={{ width: 54, textAlign: "right" }}
                >
                  {d.ago}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="three-col">
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Deals pending approval</div>
              <div className="card-sub">
                {PENDING_APPROVALS_DASHBOARD.length} in queue
              </div>
            </div>
            <button className="btn sm">See all</button>
          </div>
          {PENDING_APPROVALS_DASHBOARD.map((p, i) => (
            <div key={i} className="pa-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="av" style={{ background: avatarColor(p.agent) }}>
                  {initials(p.agent)}
                </div>
                <div className="info">
                  <div>
                    {p.learner} <ProgramBadge p={p.program} />
                  </div>
                  <div className="sub">
                    {p.agent} · {dealTypeLabel(p.type)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn sm primary">Approve</button>
                <button className="btn sm">Reject</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">At-risk metrics</div>
              <div className="card-sub">Below threshold</div>
            </div>
          </div>
          {AT_RISK_METRICS.map((r) => (
            <div key={r.n} className="pa-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`badge ${r.s}`}>
                  <span className="dot" />
                </span>
                <div className="info">
                  <div>{r.n}</div>
                  <div className="sub">{r.v}</div>
                </div>
              </div>
              <button className="btn ghost sm">View →</button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Today&apos;s dispatch</div>
              <div className="card-sub">Deal queue status</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "6px 0",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span>Agents with deals assigned</span>
                <span className="mono">8 / 8</span>
              </div>
              <div className="progress thick">
                <i style={{ width: "100%", background: "var(--teal)" }} />
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span>Total deals dispatched</span>
                <span className="mono">240</span>
              </div>
              <div className="progress thick">
                <i style={{ width: "80%", background: "var(--blue)" }} />
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span>Deals attempted so far</span>
                <span className="mono">142</span>
              </div>
              <div className="progress thick">
                <i style={{ width: "59%", background: "var(--amber)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
