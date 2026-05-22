const HISTORY = [
  { prog: "FA", sheet: "Health Sheet", date: "2026-05-18 06:12", file: "fa_health_w20.csv", rows: 1243, changes: "312 new · 88 state", by: "Emmanuel" },
  { prog: "FA", sheet: "Overview Sheet", date: "2026-05-17 18:30", file: "fa_overview_w20.csv", rows: 1198, changes: "218 new · 64 state", by: "Auto-sync" },
  { prog: "FLA", sheet: "Health Sheet", date: "2026-05-18 06:08", file: "fla_health_w20.csv", rows: 2418, changes: "487 new · 142 state", by: "Emmanuel" },
  { prog: "FLA", sheet: "Overview Sheet", date: "2026-05-17 18:42", file: "fla_overview_w20.csv", rows: 2204, changes: "362 new · 110 state", by: "Auto-sync" },
  { prog: "FLA", sheet: "Health Sheet", date: "2026-05-11 06:14", file: "fla_health_w19.csv", rows: 2276, changes: "398 new · 121 state", by: "Auto-sync" },
  { prog: "FA", sheet: "Health Sheet", date: "2026-05-11 06:10", file: "fa_health_w19.csv", rows: 1198, changes: "284 new · 76 state", by: "Auto-sync" },
  { prog: "FLA", sheet: "Overview Sheet", date: "2026-05-04 06:12", file: "fla_overview_w18.csv", rows: 2204, changes: "362 new · 110 state", by: "Auto-sync" },
  { prog: "FA", sheet: "Health Sheet", date: "2026-05-04 06:15", file: "fa_health_w18.csv", rows: 1162, changes: "261 new · 68 state", by: "Auto-sync" },
];

function sheetBadge(s: string) {
  if (s === "Health Sheet")
    return <span className="badge teal"><span className="dot" />Health</span>;
  return <span className="badge blue"><span className="dot" />Overview</span>;
}

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

export function AdminUploadHist() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Upload History</h1>
          <div className="sub">
            {HISTORY.length} uploads across both programs · Rollback re-applies the prior state
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Program</th>
              <th>Sheet Type</th>
              <th>File</th>
              <th>Rows</th>
              <th>Changes</th>
              <th>Uploaded By</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 12 }}>{h.date}</td>
                <td><ProgramBadge p={h.prog} /></td>
                <td>{sheetBadge(h.sheet)}</td>
                <td className="mono" style={{ fontSize: 12 }}>{h.file}</td>
                <td className="mono">{h.rows.toLocaleString()}</td>
                <td className="tiny">{h.changes}</td>
                <td>{h.by}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn sm">Rollback</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
