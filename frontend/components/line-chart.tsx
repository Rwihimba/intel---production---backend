interface Series {
  label: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  series: Series[];
  labels: string[];
  yMax?: number;
  w?: number;
  h?: number;
}

export function LineChart({
  series,
  labels,
  yMax,
  w = 640,
  h = 220,
}: LineChartProps) {
  const pl = 40;
  const pr = 14;
  const pt = 18;
  const pb = 30;
  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const computedMax =
    yMax ?? Math.max(...series.flatMap((s) => s.values), 1);

  function buildPath(values: number[]) {
    const pts: [number, number][] = values.map((v, i) => [
      pl + (i / (values.length - 1)) * iw,
      pt + ih - (v / computedMax) * ih,
    ]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const px = (pts[i - 1][0] + pts[i][0]) / 2;
      const py = (pts[i - 1][1] + pts[i][1]) / 2;
      d += ` Q${pts[i - 1][0]},${pts[i - 1][1]} ${px},${py}`;
      d += ` T${pts[i][0]},${pts[i][1]}`;
    }
    return { d, pts };
  }

  const gridLines = Array.from({ length: 6 }, (_, i) => {
    const y = pt + (i / 5) * ih;
    const v = Math.round(computedMax - (i / 5) * computedMax);
    return (
      <g key={`g-${i}`}>
        <line x1={pl} x2={w - pr} y1={y} y2={y} stroke="#E2E7F0" />
        <text x={pl - 8} y={y + 4} fontSize="10" fill="#9AA3B2" textAnchor="end">
          {v}
        </text>
      </g>
    );
  });

  const xLabels = labels.map((l, i) => (
    <text
      key={l + i}
      x={pl + (i / (labels.length - 1)) * iw}
      y={h - 10}
      fontSize="10"
      fill="#9AA3B2"
      textAnchor="middle"
    >
      {l}
    </text>
  ));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        {series.map((s) => (
          <span
            key={s.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--text2)",
              marginRight: 14,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.color,
                display: "inline-block",
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
        {gridLines}
        {xLabels}
        {series.map((s) => {
          const { d, pts } = buildPath(s.values);
          return (
            <g key={s.label}>
              <path
                d={d}
                stroke={s.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, i) => (
                <circle
                  key={`${s.label}-${i}`}
                  cx={p[0]}
                  cy={p[1]}
                  r="3"
                  fill="white"
                  stroke={s.color}
                  strokeWidth="1.6"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </>
  );
}
