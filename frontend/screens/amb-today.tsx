import { AMB_QUEUE_BASE } from "@/lib/mock-data";
import { QueueTable } from "./queue-table";

const CARDS = [
  { label: "Deals Assigned", value: "22 / 30", sub: "73% attempt rate" },
  { label: "Successful", value: "9", sub: "+3 vs last week" },
  { label: "Attempt Rate", value: "73%", sub: "Goal: 80%" },
  { label: "Events This Month", value: "3", sub: "Quarter total" },
];

export function AmbToday() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Good morning, Diane Mutesi.</h1>
          <div className="sub">Your queue today · Conversion + follow-up + cold lead</div>
        </div>
        <button className="btn primary">+ Register Event</button>
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
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="card-title">Today&apos;s deal queue</div>
          <div className="card-sub">
            Recruitment-focused deal types only · {AMB_QUEUE_BASE.length} active
          </div>
        </div>
        <QueueTable queue={AMB_QUEUE_BASE} />
      </div>
    </div>
  );
}
