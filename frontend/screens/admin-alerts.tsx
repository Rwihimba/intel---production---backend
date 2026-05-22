import { ALERTS_BASE } from "@/lib/mock-data";

function sevBadge(s: string) {
  if (s === "Critical")
    return <span className="badge red"><span className="dot" />{s}</span>;
  if (s === "Warning")
    return <span className="badge amber"><span className="dot" />{s}</span>;
  return <span className="badge muted"><span className="dot" />{s}</span>;
}

function sevAccent(s: string): string {
  if (s === "Critical") return "accent-red";
  if (s === "Warning") return "accent-amber";
  return "";
}

export function AdminAlerts() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Alert Centre</h1>
          <div className="sub">{ALERTS_BASE.length} active alerts across the system</div>
        </div>
        <div className="badge red">
          <span className="dot" />
          {ALERTS_BASE.filter((a) => a.severity === "Critical").length} critical
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current</th>
              <th>Target</th>
              <th>Gap</th>
              <th>Severity</th>
              <th>Detected</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {ALERTS_BASE.map((a, i) => (
              <tr key={i} className={sevAccent(a.severity)}>
                <td style={{ fontWeight: 500 }}>{a.metric}</td>
                <td className="mono">{a.current}</td>
                <td className="mono">{a.target}</td>
                <td className="mono" style={{ color: "var(--red)" }}>{a.gap}</td>
                <td>{sevBadge(a.severity)}</td>
                <td className="tiny">{a.time}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn sm">Take Action →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
