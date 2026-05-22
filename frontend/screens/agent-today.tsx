import { AGENT_QUEUE_BASE } from "@/lib/mock-data";
import { QueueTable } from "./queue-table";

const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const CARDS = [
  { label: "Deals Assigned Today", value: "30", sub: "Refreshed at 7:00 AM" },
  { label: "Successful (MTD)", value: "47", sub: "+12 vs last month" },
  { label: "Value Created", value: "RWF 28,500", sub: "This month" },
  { label: "Attempt Rate", value: "76%", sub: "22 / 30 attempted" },
];

export function AgentToday() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Good morning, Kalisa Eric.</h1>
          <div className="sub">Your queue for today · {formattedDate}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">View history</button>
          <button className="btn primary">Start next deal</button>
        </div>
      </div>
      <div className="four-col" style={{ marginBottom: 16 }}>
        {CARDS.map((c) => (
          <div key={c.label} className="kpi" style={{ padding: 18 }}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="tiny" style={{ marginTop: 6 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div className="card-title">Today&apos;s deal queue</div>
            <div className="card-sub">
              {AGENT_QUEUE_BASE.length} priority deals dispatched at 7:00 AM
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="badge teal">{AGENT_QUEUE_BASE.length} active</span>
            <span className="badge muted">0 pending review</span>
          </div>
        </div>
        <QueueTable queue={AGENT_QUEUE_BASE} />
      </div>
    </div>
  );
}
