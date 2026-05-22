import { TARGETS_BASE, fmt, fmtRWF } from "@/lib/mock-data";

function pct(t: { current: number; target: number }) {
  return t.target ? Math.min(100, (t.current / t.target) * 100) : 0;
}
function col(p: number) {
  if (p >= 80) return "var(--green)";
  if (p >= 50) return "var(--amber)";
  return "var(--red)";
}
function statusBadge(p: number) {
  if (p >= 80) return <span className="badge green"><span className="dot" />On track</span>;
  if (p >= 50) return <span className="badge amber"><span className="dot" />Behind</span>;
  return <span className="badge red"><span className="dot" />At risk</span>;
}
function fmtV(v: number, unit: string) {
  if (unit === "RWF") return fmtRWF(v);
  if (unit === "%") return v + "%";
  return fmt(v);
}

export function AdminTargets() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Strategic Targets 2026</h1>
          <div className="sub">Track progress against organisational goals · Click pencil to edit any target</div>
        </div>
        <div className="badge teal">Last reviewed 2 days ago</div>
      </div>
      {TARGETS_BASE.map((t) => {
        const p = pct(t);
        return (
          <div key={t.key} className="card" style={{ padding: "18px 22px", marginBottom: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 2fr 1fr 1fr 0.6fr 1fr 40px",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                <div className="tiny" style={{ marginTop: 3 }}>2026 strategic target</div>
              </div>
              <div>
                <div className="progress thick">
                  <i style={{ width: `${p}%`, background: col(p) }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{fmtV(t.current, t.unit)}</div>
                <div className="tiny">current</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{fmtV(t.target, t.unit)}</div>
                <div className="tiny">target</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 14, color: col(p), fontWeight: 500 }}>
                  {Math.round(p)}%
                </div>
              </div>
              <div>{statusBadge(p)}</div>
              <button
                className="btn ghost sm"
                title="Edit target"
                style={{ padding: 6, borderRadius: 8 }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
