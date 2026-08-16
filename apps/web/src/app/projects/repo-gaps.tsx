import type { GapItem } from "@/lib/agentguard/repo-rag";

const DIM_LABELS: Record<string, string> = {
  security: "Security",
  reliability: "Reliability",
  performance: "Performance",
  architecture: "Architecture",
  database: "Database",
};

const DIM_COLORS: Record<string, string> = {
  security: "border-ember/30 bg-ember/5",
  reliability: "border-sand/30 bg-sand/5",
  performance: "border-moss/30 bg-moss/5",
  architecture: "border-foam/20 bg-foam/5",
  database: "border-foam/15 bg-ink/30",
};

export function RepoGaps({ gaps, confidence }: { gaps: GapItem[]; confidence: number }) {
  if (gaps.length === 0) {
    return (
      <div className="card border-moss/30 bg-moss/10 p-5">
        <p className="font-medium text-moss">All baseline checks passed</p>
        <p className="mt-1 text-sm text-sand/75">Production confidence: {confidence}/100</p>
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
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-ember/20 px-3 py-1 font-medium text-ember">
          {gaps.length} gap{gaps.length === 1 ? "" : "s"}
        </span>
        <span className="text-sand/70">
          Confidence: <span className="font-semibold text-foam">{confidence}/100</span>
        </span>
      </div>
      {[...byDim.entries()].map(([dim, items]) => (
        <div key={dim} className={`card overflow-hidden ${DIM_COLORS[dim] || ""}`}>
          <p className="border-b border-foam/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-sand/70">
            {DIM_LABELS[dim] || dim}
          </p>
          <ul className="divide-y divide-foam/5">
            {items.map((g) => (
              <li key={g.check} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-ember">✗</span>
                  <div>
                    <p className="text-sm font-medium text-foam">{g.check.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-sand/75">{g.detail}</p>
                    {g.recommendation ? (
                      <p className="mt-2 text-xs text-moss/90">→ {g.recommendation}</p>
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
