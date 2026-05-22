import { PROGRAMS_BASE } from "@/lib/mock-data";

export function AdminPrograms() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Program Setup</h1>
          <div className="sub">Define learning programs that control deal-dispatch and graduation logic</div>
        </div>
        <button className="btn primary">+ Add New Program</button>
      </div>
      <div className="two-col" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        {PROGRAMS_BASE.map((p) => (
          <div key={p.code} className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="ico"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: p.code === "FA" ? "#5B3FBF" : "var(--blue)",
                    color: "#fff",
                    fontWeight: 600,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {p.code}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                  <div className="tiny" style={{ marginTop: 2 }}>
                    Created {p.created}
                  </div>
                </div>
              </div>
              {p.active ? (
                <span className="badge green">
                  <span className="dot" />Active
                </span>
              ) : (
                <span className="badge muted">
                  <span className="dot" />Archived
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 14 }}>
              {p.desc}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                background: "var(--surface2)",
                padding: 14,
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <div className="tiny">Total courses</div>
                <div className="mono" style={{ fontWeight: 500, fontSize: 16, marginTop: 2 }}>
                  {p.totalCourses}
                </div>
              </div>
              <div>
                <div className="tiny">Active learners</div>
                <div className="mono" style={{ fontWeight: 500, fontSize: 16, marginTop: 2 }}>
                  {p.learners.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="tiny">Code</div>
                <div className="mono" style={{ fontWeight: 500, fontSize: 16, marginTop: 2 }}>
                  {p.code}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn">Edit</button>
              <button className="btn">{p.active ? "Archive" : "Restore"}</button>
              <button className="btn ghost">Manage courses →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
