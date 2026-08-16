import { confidenceColor } from "./confidence-ring";

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = confidenceColor(value);
  return (
    <div className="group space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold tabular-nums text-text-primary">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ScoreGrid({ scores }: { scores: Record<string, number> }) {
  const dims = [
    { key: "security", label: "Security" },
    { key: "reliability", label: "Reliability" },
    { key: "performance", label: "Performance" },
    { key: "architecture", label: "Architecture" },
    { key: "database", label: "Database" },
  ];
  return (
    <div className="space-y-3">
      {dims.map((d) => (
        <ScoreBar key={d.key} label={d.label} value={scores[d.key] ?? 0} />
      ))}
    </div>
  );
}
