import { DEAL_TYPES, NUDGE_TEMPLATES_BASE, dealTypeClass, dealTypeLabel } from "@/lib/mock-data";

function ScopeCrumb({ t }: { t: typeof NUDGE_TEMPLATES_BASE[number] }) {
  const tl = dealTypeLabel(t.type);
  if (!t.scope || !t.scope.deliverable) {
    return (
      <span className="scope-crumb">
        <span style={{ color: "var(--text2)" }}>{tl}</span>
        <span style={{ color: "var(--text3)", fontSize: 11 }}>· all deliverables</span>
      </span>
    );
  }
  return (
    <span className="scope-crumb">
      <span style={{ color: "var(--text2)" }}>{tl}</span>
      <span className="crumb-sep">›</span>
      <span>{t.scope.course || "—"}</span>
      <span className="crumb-sep">›</span>
      <span style={{ color: "var(--text)", fontWeight: 500 }}>{t.scope.deliverable}</span>
    </span>
  );
}

export function AdminNudges() {
  const byType: Record<string, typeof NUDGE_TEMPLATES_BASE> = {};
  NUDGE_TEMPLATES_BASE.forEach((t) => {
    if (!byType[t.type]) byType[t.type] = [];
    byType[t.type].push(t);
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Nudge Templates</h1>
          <div className="sub">
            WhatsApp message templates agents use across deal types · Optionally scope to a specific deliverable
          </div>
        </div>
        <button className="btn primary">+ Add Template</button>
      </div>
      {DEAL_TYPES.filter((d) => byType[d.key]).map((d) => (
        <div key={d.key} style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 4px 10px",
            }}
          >
            <span className={`dt ${dealTypeClass(d.key)}`}>{d.label}</span>
            <span className="tiny">
              {byType[d.key].length} template{byType[d.key].length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Preview</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {byType[d.key].map((t) => (
                  <tr key={t.name}>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td><ScopeCrumb t={t} /></td>
                    <td className="muted" style={{ fontSize: 12, maxWidth: 380 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.body}
                      </div>
                    </td>
                    <td>
                      {t.active ? (
                        <span className="badge green"><span className="dot" />Active</span>
                      ) : (
                        <span className="badge muted"><span className="dot" />Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                        <input type="checkbox" className="chk" defaultChecked={t.active} />
                      </label>
                      <button className="btn ghost sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
