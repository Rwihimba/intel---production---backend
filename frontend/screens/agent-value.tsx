import { VALUE_BREAKDOWN, dealTypeClass, dealTypeLabel } from "@/lib/mock-data";

function eventBadge(e: string) {
  if (e === "Program Graduation") return <span className="badge green">{e}</span>;
  if (e === "Course Graduation") return <span className="badge blue">{e}</span>;
  if (e === "Retention") return <span className="badge red">{e}</span>;
  return <span className="badge teal">{e}</span>;
}

function statusBadge(s: string) {
  if (s === "Approved") return <span className="badge green"><span className="dot" />Approved</span>;
  if (s === "Pending") return <span className="badge amber"><span className="dot" />Pending</span>;
  return <span className="badge muted"><span className="dot" />{s}</span>;
}

export function AgentValue() {
  const total = VALUE_BREAKDOWN.reduce((s, v) => s + v.value, 0);

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Value Earned</h1>
          <div className="sub">Lifetime earnings from approved deals</div>
        </div>
      </div>
      <div className="card" style={{ textAlign: "center", padding: "32px 24px", marginBottom: 16 }}>
        <div
          className="tiny"
          style={{
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Lifetime value created
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 500,
            letterSpacing: -1,
            marginTop: 8,
            lineHeight: 1,
          }}
        >
          RWF {total.toLocaleString()}
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          {VALUE_BREAKDOWN.length} approved deals across event types
        </div>
      </div>
      <div className="four-col" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">Enrolled → Paid</div>
          <div className="value">RWF 500</div>
          <div className="tiny" style={{ marginTop: 6 }}>per deal</div>
        </div>
        <div className="kpi">
          <div className="label">Course Graduation</div>
          <div className="value">RWF 500</div>
          <div className="tiny" style={{ marginTop: 6 }}>per deal</div>
        </div>
        <div className="kpi">
          <div className="label">Program Graduation</div>
          <div className="value">RWF 1,500</div>
          <div className="tiny" style={{ marginTop: 6 }}>per deal</div>
        </div>
        <div className="kpi">
          <div className="label">Retention</div>
          <div className="value">RWF 500</div>
          <div className="tiny" style={{ marginTop: 6 }}>per deal</div>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="card-title">Breakdown</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Learner</th>
              <th>Deal Type</th>
              <th>Event</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Value (RWF)</th>
            </tr>
          </thead>
          <tbody>
            {VALUE_BREAKDOWN.map((v, i) => (
              <tr key={i}>
                <td className="tiny">{v.date}</td>
                <td>{v.learner}</td>
                <td>
                  <span className={`dt ${dealTypeClass(v.type)}`}>{dealTypeLabel(v.type)}</span>
                </td>
                <td>{eventBadge(v.event)}</td>
                <td>{statusBadge(v.status)}</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 500 }}>
                  {v.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
