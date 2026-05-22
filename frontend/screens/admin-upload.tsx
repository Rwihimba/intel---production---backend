const PROGRAMS = [
  { prog: "FA", name: "Founders Academy", color: "#5B3FBF" },
  { prog: "FLA", name: "Freelancer Academy", color: "#3B7DD8" },
];

const SHEET_TYPES = [
  {
    key: "health",
    label: "Program Health Sheet",
    sub: "Contains payment status, enrollment dates, activation status",
    iconHealth: true,
    lastFA: "Today, 06:12 AM",
    rowsFA: 1243,
    lastFLA: "Today, 06:08 AM",
    rowsFLA: 2418,
  },
  {
    key: "overview",
    label: "Program Overview Sheet",
    sub: "Contains course progress, submission status, graduation data",
    iconHealth: false,
    lastFA: "Yesterday, 18:30",
    rowsFA: 1198,
    lastFLA: "Yesterday, 18:42",
    rowsFLA: 2204,
  },
];

function Icon({ health }: { health: boolean }) {
  if (health) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function AdminUpload() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Upload Centre</h1>
          <div className="sub">Two sheet types per program · Last sync 2 minutes ago</div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, display: "grid" }}>
        {PROGRAMS.flatMap((p) =>
          SHEET_TYPES.map((st) => {
            const last = p.prog === "FA" ? st.lastFA : st.lastFLA;
            const rows = p.prog === "FA" ? st.rowsFA : st.rowsFLA;
            return (
              <div key={`${p.prog}-${st.key}`} className="card upload-card">
                <div className="header">
                  <div className="ico" style={{ background: p.color, display: "grid", placeItems: "center" }}>
                    <Icon health={st.iconHealth} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {p.prog} — {st.label}
                    </div>
                    <div className="tiny" style={{ marginTop: 2, lineHeight: 1.4 }}>
                      {st.sub}
                    </div>
                  </div>
                  <span className={`pchip ${p.prog}`}>{p.prog}</span>
                </div>
                <hr className="sep" />
                <div className="tiny" style={{ marginBottom: 10 }}>
                  Last upload: <b style={{ color: "var(--text2)" }}>{last}</b> · {rows.toLocaleString()} rows processed
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn primary sm">Upload New Sheet</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
