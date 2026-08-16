export type GapItem = {
  dimension: string;
  check: string;
  detail: string;
  weight: number;
  source: string;
  passed?: boolean;
  recommendation?: string;
};

export function extractGapsFromReport(report: Record<string, unknown> | null | undefined): GapItem[] {
  if (!report) return [];
  const gaps: GapItem[] = [];
  const scores = (report.scores as Record<string, unknown>) || {};
  const dimensions = (scores.dimensions as Record<string, { evidence?: Array<GapItem & { passed: boolean }> }>) || {};

  for (const [dimension, dim] of Object.entries(dimensions)) {
    for (const ev of dim.evidence || []) {
      if (!ev.passed) {
        gaps.push({
          dimension,
          check: ev.check,
          detail: ev.detail,
          weight: ev.weight,
          source: ev.source,
        });
      }
    }
  }
  return gaps;
}

export function gapCountByDimension(gaps: GapItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of gaps) {
    out[g.dimension] = (out[g.dimension] || 0) + 1;
  }
  return out;
}
