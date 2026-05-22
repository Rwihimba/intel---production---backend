import { BarChart } from "@/components/bar-chart";
import { Sparkline } from "@/components/sparkline";
import { PAYMENT_BARS, fmt } from "@/lib/mock-data";

interface MetricCard {
  label: string;
  value: string;
  target: string;
  severity: "green" | "amber" | "red" | "muted";
  trend: number[];
  unit?: string;
}

function color(s: MetricCard["severity"]): string {
  if (s === "green") return "var(--green)";
  if (s === "amber") return "var(--amber)";
  if (s === "red") return "var(--red)";
  return "var(--text3)";
}

function MetricTile({ c }: { c: MetricCard }) {
  const last = c.trend[c.trend.length - 1];
  const prev = c.trend[c.trend.length - 2] || last;
  const pctChange = prev ? ((last - prev) / Math.abs(prev)) * 100 : 0;
  const up = pctChange >= 0;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="tiny" style={{ fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {c.label}
        </div>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color(c.severity) }} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: 8,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.3px", lineHeight: 1 }}>
            {c.value}
            {c.unit ?? ""}
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="tiny">
              Target {c.target}
              {c.unit ?? ""}
            </span>
            <span className={`t-delta ${up ? "up" : "down"}`}>
              <span className="tri">{up ? "▲" : "▼"}</span>
              {Math.abs(pctChange).toFixed(1)}%
            </span>
          </div>
        </div>
        <Sparkline values={c.trend} color={color(c.severity)} w={70} h={28} />
      </div>
    </div>
  );
}

const FACTOR = 1;
const ENROLL = Math.round(4821 * FACTOR);
const PAID = Math.round(187 * FACTOR);

const ROWS: { h: string; cards: MetricCard[] }[] = [
  {
    h: "Funnel",
    cards: [
      { label: "Total Enrolled", value: fmt(ENROLL), target: fmt(13000), severity: "amber", trend: [320, 340, 380, 410, 460, 500, 540] },
      { label: "Total Paid", value: fmt(PAID), target: fmt(600), severity: "amber", trend: [80, 100, 110, 140, 160, 175, 187] },
      { label: "Conversion Rate", value: "38", target: "60", severity: "red", trend: [42, 40, 39, 40, 39, 38, 38], unit: "%" },
      { label: "Weekly Enrollment Growth", value: "+12", target: "+10", severity: "green", trend: [4, 6, 7, 8, 9, 11, 12], unit: "%" },
      { label: "Weekly Payment Growth", value: "+8", target: "+10", severity: "amber", trend: [3, 4, 4, 5, 6, 7, 8], unit: "%" },
    ],
  },
  {
    h: "Engagement",
    cards: [
      { label: "Activation Rate", value: "61", target: "90", severity: "amber", trend: [55, 57, 58, 59, 60, 60, 61], unit: "%" },
      { label: "Course Completion Rate", value: "54", target: "75", severity: "amber", trend: [48, 50, 51, 52, 53, 53, 54], unit: "%" },
      { label: "Retention Rate", value: "58", target: "80", severity: "amber", trend: [60, 59, 59, 58, 58, 58, 58], unit: "%" },
      { label: "Graduation Rate (per paid)", value: "42", target: "70", severity: "red", trend: [38, 39, 40, 40, 41, 42, 42], unit: "%" },
      { label: "Graduation Rate (per activated)", value: "51", target: "80", severity: "amber", trend: [46, 47, 48, 49, 50, 50, 51], unit: "%" },
    ],
  },
  {
    h: "Operations",
    cards: [
      { label: "Total Calls Made", value: fmt(1842), target: "—", severity: "green", trend: [180, 210, 225, 240, 260, 275, 290] },
      { label: "Events Organised", value: "7", target: "10", severity: "amber", trend: [1, 1, 1, 2, 2, 2, 7] },
      { label: "Total Attendance", value: "428", target: "500", severity: "amber", trend: [40, 52, 60, 70, 80, 90, 90] },
      { label: "NPS Score", value: "72", target: "75", severity: "amber", trend: [65, 67, 68, 70, 71, 71, 72] },
    ],
  },
  {
    h: "Partnerships",
    cards: [
      { label: "Total Value Tracked", value: "RWF 1.2M", target: "RWF 16.7M", severity: "red", trend: [200, 400, 600, 800, 1000, 1100, 1200] },
      { label: "Follow-ups Due Today", value: "3", target: "—", severity: "amber", trend: [1, 2, 3, 2, 2, 3, 3] },
      { label: "At-Risk Partnerships", value: "2", target: "0", severity: "red", trend: [0, 0, 1, 1, 2, 2, 2] },
    ],
  },
];

export function AdminMetrics() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Metrics Dashboard</h1>
          <div className="sub">All KPIs across the funnel · Weekly view</div>
        </div>
        <div className="chips" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {["Daily", "Weekly", "Monthly"].map((r) => (
            <button key={r} className={r === "Weekly" ? "active" : ""}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {ROWS.map((row) => (
        <div key={row.h} style={{ marginBottom: 16 }}>
          <div className="side-label" style={{ padding: "0 4px 8px" }}>
            {row.h}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.cards.length},minmax(0,1fr))`,
              gap: 14,
            }}
          >
            {row.cards.map((c) => (
              <MetricTile key={c.label} c={c} />
            ))}
          </div>
        </div>
      ))}
      <div className="card">
        <div className="card-h">
          <div>
            <div className="card-title">Payments over time</div>
            <div className="card-sub">Weekly · last 8 weeks</div>
          </div>
        </div>
        <BarChart values={PAYMENT_BARS} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]} />
      </div>
    </div>
  );
}
