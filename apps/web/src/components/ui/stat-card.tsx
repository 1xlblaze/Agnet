export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`glass-card p-5 ${accent ? "border-accent/20 bg-accent/5" : ""}`}>
      <p className="section-label">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}
