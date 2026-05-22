import {
  AGENT_DEAL_HISTORY,
  PROGRAMS_BASE,
  type AgentHistoryRow,
  dealTypeClass,
  dealTypeLabel,
} from "@/lib/mock-data";

function statusBadge(s: AgentHistoryRow["status"]) {
  if (s === "Approved") return <span className="badge green"><span className="dot" />Approved</span>;
  if (s === "Pending") return <span className="badge amber"><span className="dot" />Pending</span>;
  if (s === "Rejected") return <span className="badge red"><span className="dot" />Rejected</span>;
  return <span className="badge muted"><span className="dot" />{s}</span>;
}

function dlvInfo(d: AgentHistoryRow) {
  if (!["activation", "course-grad", "grad-push"].includes(d.type)) return null;
  const program = PROGRAMS_BASE.find((p) => p.code === d.program);
  if (!program) return null;
  const course = d.course ? program.courses.find((c) => c.name === d.course) : program.courses[0];
  if (!course) return null;
  const all = course.deliverables.map((dl) => dl.name);
  const done = d.deliverablesDone ?? all;
  return { courseName: course.name, all, done };
}

export function AgentHistory() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Deal History</h1>
          <div className="sub">
            {AGENT_DEAL_HISTORY.length} deals in selected range · Click Revisit to update outcomes
          </div>
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
              <th>Deliverables</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Value</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {AGENT_DEAL_HISTORY.map((d, i) => {
              const info = dlvInfo(d);
              return (
                <tr key={i} className={d.status === "Rejected" ? "accent-red" : ""}>
                  <td className="tiny">{d.date}</td>
                  <td>{d.learner}</td>
                  <td>
                    <span className={`dt ${dealTypeClass(d.type)}`}>{dealTypeLabel(d.type)}</span>
                  </td>
                  <td className="tiny" style={{ color: "var(--text2)" }}>{d.outcome}</td>
                  <td className="tiny" style={{ color: "var(--text3)" }}>{d.reason || "—"}</td>
                  <td>
                    {info ? (
                      <button
                        className="btn ghost sm"
                        style={{
                          color: info.done.length === info.all.length ? "var(--green)" : "var(--amber)",
                          fontWeight: 500,
                          fontFamily: "var(--font-dm-mono), monospace",
                          padding: "3px 8px",
                        }}
                      >
                        {info.done.length}/{info.all.length}
                      </button>
                    ) : (
                      <span className="tiny" style={{ color: "var(--text3)" }}>—</span>
                    )}
                  </td>
                  <td>{statusBadge(d.status)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {d.value ? "RWF " + d.value.toLocaleString() : "—"}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn ghost sm"
                      style={{ color: "var(--teal)", fontWeight: 500 }}
                    >
                      Revisit
                    </button>
                    {d.status === "Rejected" && <button className="btn sm">Re-engage →</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
