export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>{title}</h1>
          <div className="sub">
            This screen is part of the design and hasn&apos;t been ported yet.
          </div>
        </div>
        <span className="badge muted">
          <span className="dot" /> Placeholder
        </span>
      </div>
      <div className="card">
        <div className="card-h">
          <div>
            <div className="card-title">Coming soon</div>
            <div className="card-sub">
              The Admin Dashboard demonstrates the pattern. Re-run the design
              build to add this screen next.
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.6,
          }}
        >
          The design system (tokens, fonts, buttons, badges, KPIs, tables, etc.)
          is fully wired up — see <code className="mono">app/globals.css</code>.
          Add the matching screen component under{" "}
          <code className="mono">screens/</code> and the router will pick it up
          automatically.
        </div>
      </div>
    </div>
  );
}
