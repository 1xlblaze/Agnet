export function confidenceColor(value: number): string {
  if (value >= 80) return "rgb(var(--accent-secondary))";
  if (value >= 60) return "rgb(var(--warn))";
  return "rgb(var(--danger))";
}

export function ConfidenceRing({ value, size = "lg" }: { value: number; size?: "sm" | "lg" }) {
  const color = confidenceColor(value);
  const dim = size === "sm" ? 80 : 120;
  const r = size === "sm" ? 34 : 48;
  const stroke = size === "sm" ? 6 : 8;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: dim, height: dim }}
      role="meter"
      aria-label="Confidence score"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} aria-hidden="true">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--border))"
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
      <div className="absolute text-center" aria-hidden="true">
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
