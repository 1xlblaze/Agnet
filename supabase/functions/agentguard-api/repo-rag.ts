export type GapItem = {
  dimension: string;
  check: string;
  detail: string;
  weight: number;
  source: string;
  passed?: boolean;
  recommendation?: string;
};

type EvidenceItem = {
  check: string;
  detail: string;
  passed: boolean;
  source: string;
  weight: number;
};

type RepoChunk = {
  id: string;
  dimension: string;
  text: string;
  tokens: Set<string>;
  item: GapItem;
};

const RECOMMENDATIONS: Record<string, string> = {
  schema_migrations: "Add a migrations/ directory (Flyway, Alembic, Prisma, or golang-migrate) and version schema changes.",
  orm_or_query_layer: "Introduce an ORM or query layer (Prisma, Drizzle, GORM, SQLAlchemy) for safer database access.",
  no_env_in_repo: "Remove .env files from git; use .env.example and inject secrets via CI/CD or a secret manager.",
  dependency_lockfile: "Commit a lockfile (package-lock.json, go.sum, poetry.lock) for reproducible builds.",
  ci_workflow: "Add .github/workflows/ with lint, test, and build jobs on every pull request.",
  no_unsafe_sinks_in_tree: "Audit code for eval() and dangerouslySetInnerHTML; replace with safe alternatives.",
  automated_tests: "Add unit/integration tests under test/, __tests__/, or *_test.go files.",
  error_handling_signals: "Add structured error handling middleware and consistent error types.",
  build_config: "Add Dockerfile, Makefile, or framework build config for repeatable deployments.",
  repo_size: "Consider splitting large repos or pruning generated assets from version control.",
  language_diversity: "Consolidate languages where possible to reduce maintenance burden.",
  service_count_bounded: "Document service boundaries; consider splitting if microservices grow unchecked.",
  graph_complexity: "Simplify dependency graph — reduce circular deps and hidden coupling.",
  api_surface: "Document and limit public API surface; add API gateway or rate limiting.",
  monorepo_structure: "For multi-service repos, adopt apps/ or packages/ monorepo layout.",
  single_primary_db: "Document primary database ownership; avoid silent multi-DB sprawl.",
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

function withRecommendation(ev: EvidenceItem, dimension: string): GapItem {
  return {
    dimension,
    check: ev.check,
    detail: ev.detail,
    weight: ev.weight,
    source: ev.source,
    passed: ev.passed,
    recommendation: RECOMMENDATIONS[ev.check] || `Review the ${ev.check.replace(/_/g, " ")} finding and align with production best practices.`,
  };
}

export function extractAllEvidence(report: Record<string, unknown>): GapItem[] {
  const items: GapItem[] = [];
  const scores = (report.scores as Record<string, unknown>) || {};
  const dimensions = (scores.dimensions as Record<string, { evidence?: EvidenceItem[] }>) || {};

  for (const [dimension, dim] of Object.entries(dimensions)) {
    for (const ev of dim.evidence || []) {
      items.push(withRecommendation(ev, dimension));
    }
  }
  return items;
}

export function extractGaps(report: Record<string, unknown>): GapItem[] {
  return extractAllEvidence(report).filter((e) => !e.passed);
}

function buildChunks(items: GapItem[]): RepoChunk[] {
  return items.map((item, i) => {
    const text = `${item.dimension} ${item.check} ${item.detail} ${item.recommendation || ""}`;
    return { id: `chunk-${i}`, dimension: item.dimension, text, tokens: tokenize(text), item };
  });
}

function retrieveChunks(query: string, chunks: RepoChunk[], limit = 4): RepoChunk[] {
  const qTokens = tokenize(query);
  const synonyms: Record<string, string[]> = {
    security: ["security", "secret", "env", "vulner", "auth", "safe"],
    reliability: ["reliab", "test", "error", "handler", "stable", "idempot"],
    performance: ["perform", "speed", "size", "build", "fast", "slow"],
    architecture: ["architect", "monorepo", "graph", "structure", "layout", "design"],
    database: ["database", "db", "migrat", "orm", "sql", "schema", "postgres"],
  };

  if (qTokens.size === 0) return chunks.slice(0, limit);

  return chunks
    .map((chunk) => {
      let overlap = 0;
      for (const t of qTokens) {
        if (chunk.tokens.has(t)) overlap++;
      }
      for (const [dim, syns] of Object.entries(synonyms)) {
        if (chunk.dimension === dim && syns.some((s) => query.toLowerCase().includes(s))) overlap += 2;
      }
      const score = overlap / Math.sqrt(qTokens.size * chunk.tokens.size || 1);
      return { chunk, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.chunk);
}

function formatItem(item: GapItem, includeRec = true): string {
  const status = item.passed ? "✓ Passed" : "✗ Gap";
  let line = `${status} — ${item.check.replace(/_/g, " ")}: ${item.detail}`;
  if (!item.passed && includeRec && item.recommendation) {
    line += `\n  → Fix: ${item.recommendation}`;
  }
  return line;
}

function isStrengthsQuestion(q: string): boolean {
  return /what(?:'s| is) good|strength|passed|doing well|positive/.test(q);
}

const DIM_PATTERNS: Record<string, RegExp> = {
  security: /\b(secur|secret|\.env|vulner|auth|safe)/,
  reliability: /\b(reliab|test|error|handler|stable|idempot)/,
  performance: /\b(perform|speed|size|build|fast|slow)/,
  architecture: /\b(architect|monorepo|graph|structur|layout|design)/,
  database: /\b(database|\bdb\b|migrat|orm|sql|schema|postgres)/,
};

function isAllGapsQuestion(q: string): boolean {
  for (const pattern of Object.values(DIM_PATTERNS)) {
    if (pattern.test(q)) return false;
  }
  return /^(where|what).*(lack|weakness|shortcoming)/.test(q) ||
    /^(list|show|all)\s+(gap|issue|problem)/.test(q) ||
    /^what(?:'s| is) wrong/.test(q) ||
    /^where does this repo lack/.test(q);
}

export function answerRepoQuestion(
  report: Record<string, unknown>,
  question: string,
): { answer: string; gaps: GapItem[]; sources: string[]; intent: string } {
  const allEvidence = extractAllEvidence(report);
  const gaps = allEvidence.filter((e) => !e.passed);
  const passed = allEvidence.filter((e) => e.passed);
  const chunks = buildChunks(allEvidence);
  const q = question.toLowerCase().trim();
  const fullName = (report.full_name as string) || "this repository";
  const confidence = Number(report.production_confidence ?? (report.scores as Record<string, unknown>)?.production_confidence ?? 0);
  const scores = (report.scores as Record<string, number>) || {};

  // Dimension-specific (check BEFORE broad all-gaps)
  for (const [dim, pattern] of Object.entries(DIM_PATTERNS)) {
    if (pattern.test(q)) {
      const dimGaps = gaps.filter((g) => g.dimension === dim);
      const dimPassed = passed.filter((g) => g.dimension === dim);
      const dimScore = scores[dim] ?? "—";

      if (/good|passed|strength|positive/.test(q)) {
        const lines = dimPassed.map((p) => formatItem(p, false));
        return {
          intent: `${dim}_strengths`,
          answer: `**${dim.charAt(0).toUpperCase() + dim.slice(1)}** score: **${dimScore}/100** for ${fullName}\n\nPassed checks:\n${lines.length ? lines.join("\n") : "No passed checks recorded."}`,
          gaps: dimGaps,
          sources: dimPassed.map((p) => p.check),
        };
      }

      if (dimGaps.length === 0) {
        return {
          intent: `${dim}_clear`,
          answer: `**${dim.charAt(0).toUpperCase() + dim.slice(1)}** looks good for ${fullName} (score: **${dimScore}/100**). All ${dim} checks passed.`,
          gaps: [],
          sources: dimPassed.map((p) => p.check),
        };
      }

      const lines = dimGaps.map((g) => formatItem(g));
      return {
        intent: `${dim}_gaps`,
        answer: `**${dim.charAt(0).toUpperCase() + dim.slice(1)} gaps** for ${fullName} (score: **${dimScore}/100**):\n\n${lines.join("\n\n")}`,
        gaps: dimGaps,
        sources: dimGaps.map((g) => g.check),
      };
    }
  }

  // Explicit "show all gaps" only
  if (isAllGapsQuestion(q)) {
    if (gaps.length === 0) {
      return {
        intent: "all_clear",
        answer: `**${fullName}** scored **${confidence}/100** with no failed checks. The repo passes all baseline dimensions.`,
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
    const sections = [...byDim.entries()].map(([dim, items]) => {
      const lines = items.map((g) => formatItem(g));
      return `**${dim.charAt(0).toUpperCase() + dim.slice(1)}** (${items.length}):\n${lines.join("\n\n")}`;
    });
    return {
      intent: "all_gaps",
      answer: `**${fullName}** — **${gaps.length} gaps** found (confidence: **${confidence}/100**):\n\n${sections.join("\n\n")}`,
      gaps,
      sources: gaps.map((g) => g.check),
    };
  }

  // Strengths overview
  if (isStrengthsQuestion(q)) {
    const top = passed.slice(0, 6).map((p) => formatItem(p, false));
    return {
      intent: "strengths",
      answer: `**Strengths** for ${fullName} (confidence: **${confidence}/100**):\n\n${top.join("\n")}\n\nScores: Security ${scores.security}, Reliability ${scores.reliability}, Performance ${scores.performance}, Architecture ${scores.architecture}, Database ${scores.database}.`,
      gaps: [],
      sources: passed.map((p) => p.check),
    };
  }

  // RAG retrieval for free-form questions
  const relevant = retrieveChunks(question, chunks, 4);
  if (relevant.length > 0) {
    const lines = relevant.map((c) => formatItem(c.item));
    return {
      intent: "retrieval",
      answer: `For **${fullName}**, based on your question:\n\n${lines.join("\n\n")}`,
      gaps: relevant.filter((c) => !c.item.passed).map((c) => c.item),
      sources: relevant.map((c) => c.item.check),
    };
  }

  // How to improve / fix
  if (/how (to )?fix|how (can|do) i improve|what should i do|recommend/.test(q)) {
    if (gaps.length === 0) {
      return { intent: "fix_none", answer: `No fixes needed — ${fullName} passes all baseline checks.`, gaps: [], sources: [] };
    }
    const top = gaps.slice(0, 3).map((g) => formatItem(g));
    return {
      intent: "fix_top",
      answer: `**Top priorities** to improve ${fullName}:\n\n${top.join("\n\n")}\n\n${gaps.length > 3 ? `Plus ${gaps.length - 3} more gaps — ask about a specific area (security, tests, database).` : ""}`,
      gaps: gaps.slice(0, 3),
      sources: gaps.slice(0, 3).map((g) => g.check),
    };
  }

  // Default: concise summary (NOT the same as all-gaps)
  return {
    intent: "summary",
    answer: `**${fullName}** baseline (confidence: **${confidence}/100**)\n- Security: ${scores.security ?? "—"} · Reliability: ${scores.reliability ?? "—"} · Performance: ${scores.performance ?? "—"}\n- Architecture: ${scores.architecture ?? "—"} · Database: ${scores.database ?? "—"}\n- **${gaps.length} gaps** total\n\nTry: "security gaps", "what's good about reliability?", "how can I improve?", or "where does this repo lack?"`,
    gaps,
    sources: [],
  };
}
