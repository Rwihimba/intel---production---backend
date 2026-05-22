interface SparklineProps {
  values: number[];
  w?: number;
  h?: number;
  color?: string;
}

export function Sparkline({ values, w = 60, h = 18, color = "var(--teal)" }: SparklineProps) {
  if (values.length < 2) return null;
  const mi = Math.min(...values);
  const ma = Math.max(...values);
  const ra = ma - mi || 1;
  const pts = values.map((v, i): [number, number] => [
    (i / (values.length - 1)) * w,
    h - ((v - mi) / ra) * (h - 2) - 1,
  ]);
  const d = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  return (
    <svg className="spark" width={w} height={h}>
      <path
        d={d}
        stroke={color}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="1.5" fill={color} />
      ))}
    </svg>
  );
}
