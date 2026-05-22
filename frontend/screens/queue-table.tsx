import {
  type QueueDeal,
  avatarColor,
  dealTypeClass,
  dealTypeLabel,
  initials,
} from "@/lib/mock-data";

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

export function QueueTable({ queue }: { queue: QueueDeal[] }) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: 40 }}>#</th>
          <th>Learner</th>
          <th>Phone</th>
          <th>Program</th>
          <th>Deal Type</th>
          <th>Last Engaged</th>
          <th>Nudge</th>
          <th style={{ textAlign: "right" }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {queue.map((d, i) => (
          <tr key={`${d.rank}-${d.learner}`}>
            <td>
              <span className="mono" style={{ color: "var(--text3)", fontSize: 12 }}>
                {d.rank || i + 1}
              </span>
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="av" style={{ background: avatarColor(d.learner) }}>
                  {initials(d.learner)}
                </div>
                <div style={{ fontWeight: 500 }}>{d.learner}</div>
              </div>
            </td>
            <td className="mono" style={{ fontSize: 12 }}>{d.phone}</td>
            <td><ProgramBadge p={d.program} /></td>
            <td>
              <span className={`dt ${dealTypeClass(d.type)}`}>{dealTypeLabel(d.type)}</span>
            </td>
            <td className="tiny">{d.last}</td>
            <td>
              <button className="btn sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.4 8.4 0 0 1-4.3-1.2L3 20l1.4-5a8.4 8.4 0 1 1 16.6-3.5z" />
                </svg>
              </button>
            </td>
            <td style={{ textAlign: "right" }}>
              <button className="btn primary sm">Start Deal</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
