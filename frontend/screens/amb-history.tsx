import { AGENT_DEAL_HISTORY, type AgentHistoryRow, dealTypeClass, dealTypeLabel } from "@/lib/mock-data";

const RECRUITMENT_TYPES = new Set(["conversion", "followup", "cold"]);

const EXTRA: AgentHistoryRow[] = [
  { date: "2026-05-15", learner: "Aline Iribagiza", type: "conversion", outcome: "Paid", reason: "", status: "Approved", value: 500 },
  { date: "2026-05-12", learner: "Hijo Abayo", type: "cold", outcome: "Enrolled", reason: "", status: "Approved", value: 300 },
];

function statusBadge(s: AgentHistoryRow["status"]) {
  if (s === "Approved") return <span className="badge green"><span className="dot" />Approved</span>;
  if (s === "Pending") return <span className="badge amber"><span className="dot" />Pending</span>;
  if (s === "Rejected") return <span className="badge red"><span className="dot" />Rejected</span>;
  return <span className="badge muted"><span className="dot" />{s}</span>;
}

export function AmbHistory() {
  const rows: AgentHistoryRow[] = [
    ...AGENT_DEAL_HISTORY.filter((d) => RECRUITMENT_TYPES.has(d.type)),
    ...EXTRA,
  ];

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Deal History</h1>
          <div className="sub">{rows.length} recruitment deals in selected range</div>
        </div>
        <div className="chips" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <button className="active">This week</button>
          <button>This month</button>
          <button>Custom range</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Learner</th>
              <th>Deal Type</th>
              <th>Outcome</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={i} className={d.status === "Rejected" ? "accent-red" : ""}>
                <td className="tiny">{d.date}</td>
                <td>{d.learner}</td>
                <td>
                  <span className={`dt ${dealTypeClass(d.type)}`}>{dealTypeLabel(d.type)}</span>
                </td>
                <td className="tiny" style={{ color: "var(--text2)" }}>{d.outcome}</td>
                <td className="tiny" style={{ color: "var(--text3)" }}>{d.reason || "—"}</td>
                <td>{statusBadge(d.status)}</td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {d.value ? "RWF " + d.value.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
