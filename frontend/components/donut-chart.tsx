interface Reason {
  key: string;
  label: string;
  color: string;
}

interface DonutChartProps {
  reasons: Reason[];
  reports: { reason: string }[];
}

export function DonutChart({ reasons, reports }: DonutChartProps) {
  const counts: Record<string, number> = {};
  reasons.forEach((r) => (counts[r.key] = 0));
  for (const r of reports) {
    if (counts[r.reason] != null) counts[r.reason]++;
  }
  const total = reports.length || 1;
  const w = 220;
  const h = 220;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 88;
  const innerR = 56;
  let cur = -Math.PI / 2;
  const segs = reasons
    .map((reason) => {
      const c = counts[reason.key] || 0;
      const angle = (c / total) * Math.PI * 2;
      if (c === 0) return null;
      const a0 = cur;
      const a1 = cur + angle;
      cur = a1;
      const x0 = cx + radius * Math.cos(a0);
      const y0 = cy + radius * Math.sin(a0);
      const x1 = cx + radius * Math.cos(a1);
      const y1 = cy + radius * Math.sin(a1);
      const x2 = cx + innerR * Math.cos(a1);
      const y2 = cy + innerR * Math.sin(a1);
      const x3 = cx + innerR * Math.cos(a0);
      const y3 = cy + innerR * Math.sin(a0);
      const large = angle > Math.PI ? 1 : 0;
      return (
        <path
          key={reason.key}
          d={`M${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${innerR},${innerR} 0 ${large} 0 ${x3},${y3} Z`}
          fill={reason.color}
          opacity="0.92"
        >
          <title>{`${reason.label}: ${c} (${Math.round((c / total) * 100)}%)`}</title>
        </path>
      );
    })
    .filter(Boolean);

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          {segs}
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 500, lineHeight: 1 }}>{total}</div>
          <div className="tiny" style={{ marginTop: 2 }}>
            reports
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        {reasons.map((reason) => {
          const c = counts[reason.key] || 0;
          const pct = Math.round((c / total) * 100);
          return (
            <div
              key={reason.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                padding: "4px 0",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: reason.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, color: "var(--text2)" }}>{reason.label}</span>
              <span className="mono" style={{ fontWeight: 500 }}>
                {c}
              </span>
              <span className="tiny" style={{ width: 38, textAlign: "right" }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
