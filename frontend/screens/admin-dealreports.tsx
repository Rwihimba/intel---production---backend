import { DonutChart } from "@/components/donut-chart";
import {
  PAYMENT_BARRIERS,
  PAYMENT_REPORTS,
  SUBMISSION_BARRIERS,
  SUBMISSION_REPORTS,
  avatarColor,
  initials,
} from "@/lib/mock-data";

function ReportsTable({
  panel,
  reasons,
  reports,
}: {
  panel: "payment" | "submission";
  reasons: { key: string; label: string; color: string }[];
  reports: (typeof PAYMENT_REPORTS)[number][] | (typeof SUBMISSION_REPORTS)[number][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl" style={{ background: "transparent" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Agent</th>
            <th>Learner</th>
            {panel === "submission" && <th>Course</th>}
            <th>Reason</th>
            <th>Comment</th>
            <th>Follow-up</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => {
            const reasonObj = reasons.find((x) => x.key === r.reason) ?? {
              label: r.reason,
              color: "#9AA3B2",
            };
            return (
              <tr key={i} className="row-clickable">
                <td className="tiny">{r.date}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      className="av"
                      style={{ background: avatarColor(r.agent), width: 24, height: 24, fontSize: 9 }}
                    >
                      {initials(r.agent)}
                    </div>
                    <span style={{ fontSize: 12 }}>{r.agent}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{r.learner}</td>
                {panel === "submission" && (
                  <td>
                    <span className="badge muted" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500 }}>
                      {(r as (typeof SUBMISSION_REPORTS)[number]).course}
                    </span>
                  </td>
                )}
                <td>
                  <span
                    className="badge"
                    style={{
                      background: `${reasonObj.color}20`,
                      color: reasonObj.color,
                      fontWeight: 500,
                    }}
                  >
                    {reasonObj.label}
                  </span>
                </td>
                <td
                  style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    maxWidth: 260,
                  }}
                >
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.comment}
                  </div>
                </td>
                <td className="tiny" style={{ color: r.followup === "—" ? "var(--text3)" : "var(--text2)" }}>
                  {r.followup}
                </td>
                <td style={{ color: "var(--text3)", fontSize: 12, textAlign: "right" }}>▾</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDealReports() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Deal Reports</h1>
          <div className="sub">
            Real-time transparency on why deals aren&apos;t succeeding · drawn from agent failure reports
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">Export Payment CSV</button>
          <button className="btn">Export Submission CSV</button>
        </div>
      </div>
      <div className="date-range">
        <span className="dr-lbl">Viewing data from</span>
        <input type="date" defaultValue="2026-04-19" />
        <span className="dr-sep">to</span>
        <input type="date" defaultValue="2026-05-19" />
        <div className="dr-quick">
          {[["7d", "Last 7d"], ["30d", "Last 30d"], ["90d", "Last 90d"], ["ytd", "YTD"]].map(([k, l]) => (
            <button key={k} className={k === "30d" ? "active" : ""}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(540px,1fr))", gap: 14 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Payment Barriers</div>
              <div className="card-sub">Reasons agents report for failed conversion deals</div>
            </div>
            <span className="badge red">{PAYMENT_REPORTS.length} reports</span>
          </div>
          <DonutChart reasons={PAYMENT_BARRIERS} reports={PAYMENT_REPORTS} />
          <hr className="sep" />
          <div className="side-label" style={{ padding: "0 0 8px" }}>
            Individual reports · most recent first
          </div>
          <ReportsTable panel="payment" reasons={PAYMENT_BARRIERS} reports={PAYMENT_REPORTS} />
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Submission Barriers</div>
              <div className="card-sub">Reasons agents report for failed activation and graduation deals</div>
            </div>
            <span className="badge amber">{SUBMISSION_REPORTS.length} reports</span>
          </div>
          <DonutChart reasons={SUBMISSION_BARRIERS} reports={SUBMISSION_REPORTS} />
          <hr className="sep" />
          <div className="side-label" style={{ padding: "0 0 8px" }}>
            Individual reports · most recent first
          </div>
          <ReportsTable panel="submission" reasons={SUBMISSION_BARRIERS} reports={SUBMISSION_REPORTS} />
        </div>
      </div>
    </div>
  );
}
