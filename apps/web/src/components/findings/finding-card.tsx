import { StatusBadge } from "@/components/ui/status-badge";

type Finding = {
  id?: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
  confidence: number;
  status: string;
  evidence?: unknown;
};

export function FindingCard({ finding }: { finding: Finding }) {
  const sev = finding.severity.toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  return (
    <article className="rounded-lg border border-hairline bg-surface-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={sev} variant={sev} />
        <StatusBadge label={finding.category} variant="LOW" />
        <StatusBadge label={finding.status} variant={finding.status === "resolved" ? "resolved" : "open"} />
      </div>
      <h3 className="mt-3 font-display text-xl tracking-[-0.02em] text-ink">{finding.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{finding.description}</p>
      {finding.file ? (
        <p className="mt-3 font-mono text-xs text-muted">
          {finding.file}
          {finding.line ? `:${finding.line}` : ""}
        </p>
      ) : null}
      <div className="mt-4 rounded-md border border-hairline-soft bg-canvas-soft p-3 text-sm text-body">
        <span className="font-semibold text-ink">Recommendation:</span> {finding.recommendation}
      </div>
      <p className="mt-3 text-xs text-muted">
        Confidence {(finding.confidence * 100).toFixed(0)}%
      </p>
    </article>
  );
}
