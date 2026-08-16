export function confidenceColor(value: number) {
  if (value >= 80) return "#34d399";
  if (value >= 60) return "#fbbf24";
  return "#f87171";
}

export function ConfidenceRing({ value, size = "lg" }: { value: number; size?: "sm" | "lg" }) {
  const color = confidenceColor(value);
  const dim = size === "sm" ? 80 : 120;
  const r = size === "sm" ? 34 : 48;
  const stroke = size === "sm" ? 6 : 8;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className={`font-display font-semibold text-text-primary ${size === "sm" ? "text-2xl" : "text-4xl"}`}>
          {value}
        </p>
        {size === "lg" ? (
          <p className="text-[10px] uppercase tracking-wider text-text-muted">confidence</p>
        ) : null}
      </div>
    </div>
  );
}
