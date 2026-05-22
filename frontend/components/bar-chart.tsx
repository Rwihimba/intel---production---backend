interface BarChartProps {
  values: number[];
  labels: string[];
  w?: number;
  h?: number;
  color?: string;
  target?: number;
  yMax?: number;
}

export function BarChart({
  values,
  labels,
  w = 640,
  h = 200,
  color = "var(--teal)",
  target,
  yMax,
}: BarChartProps) {
  const pl = 40;
  const pr = 14;
  const pt = 18;
  const pb = 30;
  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const ma = Math.max(...values, 1);
  const computedMax = yMax ?? (Math.ceil(ma / 50) * 50 || 50);
  const bw = (iw / values.length) * 0.62;
  const gap = iw / values.length;

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = pt + (i / 4) * ih;
    const v = Math.round(computedMax - (i / 4) * computedMax);
    return (
      <g key={i}>
        <line x1={pl} x2={w - pr} y1={y} y2={y} stroke="#E2E7F0" />
        <text x={pl - 8} y={y + 4} fontSize="10" fill="#9AA3B2" textAnchor="end">
          {v}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {gridLines}
      {labels.map((l, i) => (
        <text
          key={`l-${i}`}
          x={pl + i * gap + gap / 2}
          y={h - 10}
          fontSize="10"
          fill="#9AA3B2"
          textAnchor="middle"
        >
          {l}
        </text>
      ))}
      {values.map((v, i) => {
        const x = pl + i * gap + (gap - bw) / 2;
        const bh = (v / computedMax) * ih;
        const y = pt + ih - bh;
        return <rect key={i} x={x} y={y} width={bw} height={bh} rx="4" fill={color} opacity="0.9" />;
      })}
      {typeof target === "number" && (
        <>
          <line
            x1={pl}
            x2={w - pr}
            y1={pt + ih - (target / computedMax) * ih}
            y2={pt + ih - (target / computedMax) * ih}
            stroke="#9AA3B2"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={w - pr - 4}
            y={pt + ih - (target / computedMax) * ih - 4}
            fontSize="10"
            fill="#9AA3B2"
            textAnchor="end"
          >
            Target {target}
          </text>
        </>
      )}
    </svg>
  );
}
