import { PARTNERSHIPS, fmtRWF } from "@/lib/mock-data";

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

function stageBadge(s: string) {
  if (s === "Active") return <span className="badge green">Active</span>;
  if (s === "Prospect") return <span className="badge muted">Prospect</span>;
  if (s === "At Risk") return <span className="badge amber">At Risk</span>;
  if (s === "No Signs of Life") return <span className="badge red">No Signs of Life</span>;
  return <span className="badge muted">{s}</span>;
}

export function AdminPartnerships() {
  const total = PARTNERSHIPS.reduce((s, p) => s + p.value, 0);
  const followups = 3;
  const risk = PARTNERSHIPS.filter(
    (p) => p.stage === "At Risk" || p.stage === "No Signs of Life"
  ).length;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Partnership Tracker</h1>
          <div className="sub">Active and prospective relationships across both programs</div>
        </div>
        <button className="btn primary">+ Add Partnership</button>
      </div>
      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">Total Tracked Value</div>
          <div className="value">{fmtRWF(total)}</div>
          <div className="tiny" style={{ marginTop: 6 }}>
            {PARTNERSHIPS.length} partnerships
          </div>
        </div>
        <div className="kpi">
          <div className="label">Follow-ups Due</div>
          <div className="value">{followups}</div>
          <div className="tiny" style={{ marginTop: 6 }}>Within next 7 days</div>
        </div>
        <div className="kpi">
          <div className="label">At Risk</div>
          <div className="value">{risk}</div>
          <div className="tiny" style={{ marginTop: 6 }}>Requires attention</div>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Org Name</th>
              <th>Contact</th>
              <th>Program Scope</th>
              <th>Value (RWF)</th>
              <th>Stage</th>
              <th>Last Interaction</th>
              <th>Next Follow-up</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {PARTNERSHIPS.map((p, i) => (
              <tr key={i} className={p.stage === "No Signs of Life" ? "accent-red" : ""}>
                <td style={{ fontWeight: 500 }}>{p.org}</td>
                <td>{p.contact}</td>
                <td><ProgramBadge p={p.program} /></td>
                <td className="mono">{p.value.toLocaleString()}</td>
                <td>{stageBadge(p.stage)}</td>
                <td className="tiny">{p.last}</td>
                <td className="tiny">{p.next}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn ghost sm" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button className="btn ghost sm" title="Log interaction">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
