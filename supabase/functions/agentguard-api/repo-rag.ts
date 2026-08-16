export type GapItem = {
  dimension: string;
  check: string;
  detail: string;
  weight: number;
  source: string;
};

type EvidenceItem = GapItem & { passed: boolean };

export type RepoChunk = {
  id: string;
  dimension: string;
  text: string;
  tokens: Set<string>;
  gap: GapItem;
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

export function extractGaps(report: Record<string, unknown>): GapItem[] {
  const gaps: GapItem[] = [];
  const scores = (report.scores as Record<string, unknown>) || {};
  const dimensions = (scores.dimensions as Record<string, { score?: number; evidence?: EvidenceItem[] }>) || {};

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

  // Fallback: baseline document scores structure
  const baseline = report.baseline as Record<string, unknown> | undefined;
  const baselineScores = (baseline?.scores as Record<string, { evidence?: EvidenceItem[] }>) || {};
  if (gaps.length === 0) {
    for (const [dimension, dim] of Object.entries(baselineScores)) {
      if (dimension === "meta" || dimension === "rubric_version" || dimension === "production_confidence") continue;
      const evidence = dim.evidence || [];
      for (const ev of evidence) {
        if (!ev.passed) {
          gaps.push({ dimension, check: ev.check, detail: ev.detail, weight: ev.weight, source: ev.source });
        }
      }
    }
  }

  return gaps;
}

function buildChunks(gaps: GapItem[]): RepoChunk[] {
  return gaps.map((gap, i) => {
    const text = `${gap.dimension} ${gap.check}: ${gap.detail}`;
    return {
      id: `gap-${i}`,
      dimension: gap.dimension,
      text,
      tokens: tokenize(text),
      gap,
    };
  });
}

function retrieveChunks(query: string, chunks: RepoChunk[], limit = 5): RepoChunk[] {
  const qTokens = tokenize(query);
  if (qTokens.size === 0) return chunks.slice(0, limit);

  return chunks
    .map((chunk) => {
      let overlap = 0;
      for (const t of qTokens) {
        if (chunk.tokens.has(t)) overlap++;
      }
      const score = overlap / Math.sqrt(qTokens.size * chunk.tokens.size || 1);
      return { chunk, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.chunk);
}

function formatGaps(gaps: GapItem[], title: string): string {
  if (gaps.length === 0) return `**${title}:** No gaps found — all checks passed for this area.`;
  const lines = gaps.map(
    (g) => `- **${g.check}** (${g.dimension}): ${g.detail}`,
  );
  return `**${title}** (${gaps.length} gap${gaps.length === 1 ? "" : "s"}):\n${lines.join("\n")}`;
}

export function answerRepoQuestion(
  report: Record<string, unknown>,
  question: string,
): { answer: string; gaps: GapItem[]; sources: string[] } {
  const gaps = extractGaps(report);
  const chunks = buildChunks(gaps);
  const q = question.toLowerCase().trim();
  const fullName = (report.full_name as string) || "this repository";
  const confidence = Number(report.production_confidence ?? (report.scores as Record<string, unknown>)?.production_confidence ?? 0);

  const sources: string[] = [];

  // Broad "where does it lack" questions
  if (/lack|gap|weak|missing|improve|issue|problem|fail|concern|shortcoming|deficien/.test(q) && !/security|reliab|perform|architect|database|test|ci/.test(q)) {
    if (gaps.length === 0) {
      return {
        answer: `**${fullName}** scored **${confidence}/100** production confidence with no failed baseline checks. The repository looks solid across security, reliability, performance, architecture, and database dimensions.`,
        gaps: [],
        sources: [],
      };
    }
    const byDim = new Map<string, GapItem[]>();
    for (const g of gaps) {
      const list = byDim.get(g.dimension) || [];
      list.push(g);
      byDim.set(g.dimension, list);
    }
    const sections = [...byDim.entries()].map(([dim, items]) => formatGaps(items, dim.charAt(0).toUpperCase() + dim.slice(1)));
    return {
      answer: `**${fullName}** has **${gaps.length} gap${gaps.length === 1 ? "" : "s"}** (production confidence: **${confidence}/100**):\n\n${sections.join("\n\n")}\n\nRun baseline again after fixes to refresh scores.`,
      gaps,
      sources: gaps.map((g) => g.check),
    };
  }

  // Dimension-specific
  const dimMap: Record<string, RegExp> = {
    security: /secur|secret|env|vulner|auth/,
    reliability: /reliab|test|error|handler|idempot/,
    performance: /perform|speed|size|build/,
    architecture: /architect|monorepo|graph|complex|api surface/,
    database: /database|db|migrat|orm|sql|schema/,
  };

  for (const [dim, pattern] of Object.entries(dimMap)) {
    if (pattern.test(q)) {
      const dimGaps = gaps.filter((g) => g.dimension === dim);
      return {
        answer: formatGaps(dimGaps, `${dim.charAt(0).toUpperCase() + dim.slice(1)} gaps for ${fullName}`),
        gaps: dimGaps,
        sources: dimGaps.map((g) => g.check),
      };
    }
  }

  // RAG retrieval over gap chunks
  const relevant = retrieveChunks(question, chunks, 5);
  if (relevant.length > 0) {
    const matched = relevant.map((c) => c.gap);
    sources.push(...matched.map((g) => g.check));
    const lines = matched.map((g) => `- **${g.check}** (${g.dimension}): ${g.detail}`);
    return {
      answer: `Based on the baseline scan of **${fullName}**:\n\n${lines.join("\n")}`,
      gaps: matched,
      sources,
    };
  }

  // Score summary fallback
  const scores = (report.scores as Record<string, number>) || {};
  return {
    answer: `**${fullName}** baseline summary (confidence: **${confidence}/100**):\n- Security: ${scores.security ?? "—"}\n- Reliability: ${scores.reliability ?? "—"}\n- Performance: ${scores.performance ?? "—"}\n- Architecture: ${scores.architecture ?? "—"}\n- Database: ${scores.database ?? "—"}\n\nAsk about specific areas: "security gaps", "missing tests", "database issues", or "where does this repo lack?"`,
    gaps,
    sources: [],
  };
}
