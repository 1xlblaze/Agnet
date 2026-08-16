import type { GapItem } from "@/lib/agentguard/repo-rag";

const DIM_LABELS: Record<string, string> = {
  security: "Security",
  reliability: "Reliability",
  performance: "Performance",
  architecture: "Architecture",
  database: "Database",
};

export function RepoGaps({ gaps, confidence }: { gaps: GapItem[]; confidence: number }) {
  if (gaps.length === 0) {
    return (
      <div className="border border-moss/30 bg-moss/10 px-4 py-3">
        <p className="text-sm text-moss">All baseline checks passed. Production confidence: {confidence}/100</p>
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
      <p className="text-sm text-sand/80">
        <span className="font-semibold text-ember">{gaps.length}</span> gap{gaps.length === 1 ? "" : "s"} found
        {" · "}Production confidence: <span className="text-foam">{confidence}/100</span>
      </p>
      {[...byDim.entries()].map(([dim, items]) => (
        <div key={dim} className="border border-foam/10 bg-ink/30">
          <p className="border-b border-foam/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-sand/70">
            {DIM_LABELS[dim] || dim} ({items.length})
          </p>
          <ul className="divide-y divide-foam/5">
            {items.map((g) => (
              <li key={g.check} className="px-4 py-3">
                <p className="text-sm font-medium text-foam">{g.check.replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm text-sand/75">{g.detail}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-sand/45">{g.source}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
