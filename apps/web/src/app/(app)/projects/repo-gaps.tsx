import type { GapItem } from "@/lib/agentguard/repo-rag";

const DIM_LABELS: Record<string, string> = {
  security: "Security",
  reliability: "Reliability",
  performance: "Performance",
  architecture: "Architecture",
  database: "Database",
};

const DIM_ACCENTS: Record<string, string> = {
  security: "border-danger/25 bg-danger/5",
  reliability: "border-warn/25 bg-warn/5",
  performance: "border-accent/25 bg-accent/5",
  architecture: "border-border bg-surface-raised/50",
  database: "border-border bg-surface-raised/50",
};

export function RepoGaps({ gaps, confidence }: { gaps: GapItem[]; confidence: number }) {
  if (gaps.length === 0) {
    return (
      <div className="glass-card border-accent/25 bg-accent/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">✓</div>
          <div>
            <p className="font-medium text-accent">All baseline checks passed</p>
            <p className="mt-0.5 text-sm text-text-secondary">Production confidence: {confidence}/100</p>
          </div>
        </div>
      </div>
    );
  }

  const byDim = new Map<string, GapItem[]>();
  for (const g of gaps) {
    const list = byDim.get(g.dimension) || [];
    list.push(g);
    byDim.set(g.dimension, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge-danger">{gaps.length} gap{gaps.length === 1 ? "" : "s"}</span>
        <span className="text-sm text-text-secondary">
          Confidence: <span className="font-semibold text-text-primary">{confidence}/100</span>
        </span>
      </div>
      {[...byDim.entries()].map(([dim, items]) => (
        <div key={dim} className={`glass-card overflow-hidden ${DIM_ACCENTS[dim] || ""}`}>
          <p className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            {DIM_LABELS[dim] || dim}
          </p>
          <ul className="divide-y divide-border">
            {items.map((g) => (
              <li key={g.check} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/15 text-xs text-danger">
                    ✗
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{g.check.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-text-secondary">{g.detail}</p>
                    {g.recommendation ? (
                      <p className="mt-2 rounded-lg bg-accent/5 px-3 py-2 text-xs text-accent">
                        → {g.recommendation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
