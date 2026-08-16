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

type GraphNode = { id: string; type: string; name: string };
type GraphEdge = { from: string; to: string; type: string };
type RepoGraph = { nodes: GraphNode[]; edges: GraphEdge[] };

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

function getBaselineContext(report: Record<string, unknown>) {
  const baselineDoc = (report.baseline as Record<string, unknown>) || {};
  const info = (baselineDoc.baseline as Record<string, unknown>) || {};
  const graph = (baselineDoc.graph as RepoGraph) || { nodes: [], edges: [] };
  const pathsSample = (info.paths_sample as string[]) || [];
  const allPaths = pathsSample; // sample used for inference; full tree is in file_count
  return {
    info,
    graph,
    pathsSample,
    languages: (info.languages as string[]) || [],
    services: (info.services as string[]) || [],
    databases: (info.databases as string[]) || [],
    fileCount: info.file_count as number | undefined,
    paths: allPaths,
  };
}

function inferStructureSignals(paths: string[]): string[] {
  const signals: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/^apps\//, "Monorepo-style apps/ workspace"],
    [/^packages\//, "Shared packages/ libraries"],
    [/db\/migrations/, "SQL schema migrations (db/migrations/)"],
    [/^e2e\//, "End-to-end test suite (e2e/)"],
    [/^deploy\//, "Dedicated deploy/ directory (workers, infra)"],
    [/docker-compose/, "Docker Compose for multi-service local stack"],
    [/\.github\/workflows\//, "GitHub Actions CI/CD workflows"],
    [/^docs\//, "Documentation in docs/"],
    [/eslint\.config/, "ESLint static analysis"],
    [/next\.config/, "Next.js application"],
    [/go\.mod$/, "Go module root"],
    [/cmd\//, "Go cmd/ entrypoints (CLI or services)"],
    [/internal\//, "Go internal/ packages"],
    [/supabase\//, "Supabase backend integration"],
    [/prisma\//, "Prisma ORM schema"],
  ];
  for (const [pattern, label] of checks) {
    if (paths.some((p) => pattern.test(p))) signals.push(label);
  }
  return signals;
}

function inferRepoPurpose(name: string, languages: string[], paths: string[], services: string[]): string {
  const blob = `${name} ${paths.join(" ")}`.toLowerCase();
  const hints: string[] = [];

  if (/foundry|workflow|pipeline|orchestrat/.test(blob)) {
    hints.push("workflow / automation platform");
  }
  if (/agent|guard|control.?plane/.test(blob)) {
    hints.push("agent control plane or safety tooling");
  }
  if (languages.includes("TypeScript") && paths.some((p) => /e2e|playwright|cypress/.test(p))) {
    hints.push("TypeScript product with browser E2E verification");
  }
  if (languages.includes("Go") && languages.includes("TypeScript")) {
    hints.push("polyglot TypeScript + Go system (web UI + Go services/workers)");
  }
  if (paths.some((p) => /db\/migrations/.test(p))) {
    hints.push("persistent platform data via SQL migrations");
  }
  if (services.length > 0) {
    hints.push(`primary service surface: ${services.join(", ")}`);
  }

  if (hints.length === 0) {
    const primary = languages[0] || "unknown";
    return `A ${primary}-centric codebase (${languages.join(", ") || "mixed languages"}).`;
  }
  return hints.join("; ");
}

function formatGraphSummary(graph: RepoGraph): string {
  if (!graph.nodes.length) return "No architecture graph nodes detected.";
  const nodeLines = graph.nodes.map((n) => `  • ${n.type}: ${n.name}`);
  const edgeLines = graph.edges.map((e) => `  • ${e.from} → ${e.to} (${e.type})`);
  return `**Detected components** (${graph.nodes.length} nodes, ${graph.edges.length} edges)\n${nodeLines.join("\n")}${edgeLines.length ? `\n\n**Dependencies**\n${edgeLines.join("\n")}` : ""}`;
}

function formatPathSample(paths: string[]): string {
  if (!paths.length) return "";
  const top = paths.slice(0, 12).map((p) => `  • ${p}`);
  return `**Key paths from repository scan**\n${top.join("\n")}`;
}

function isGapFocusedQuestion(q: string): boolean {
  return /gap|issue|problem|lack|wrong|fail|weakness|weak|concern|risk|vulner|fix|broken/.test(q);
}

function isExplainArchitecture(q: string): boolean {
  return (
    /\b(explain|describe|overview|walk me through|how is|what is|show me).*(architect|structure|layout|design|organized|built)/.test(q) ||
    /^explain architecture/.test(q) ||
    /what(?:'s| is) the architecture/.test(q)
  );
}

function isExplainPurpose(q: string): boolean {
  return (
    /what(?:'s| is) (this|the) repo (about|do)|what does this repo do|tell me about (this|the) repo|describe (this|the) repo|purpose of (this|the) repo|what is gofoundry/.test(q) ||
    /\b(explain|describe).*(repo|project|codebase|purpose)/.test(q)
  );
}

function isDimensionExplain(q: string, dim: string): boolean {
  const patterns: Record<string, RegExp> = {
    security: /\b(explain|describe|overview).*(secur|auth|secret)/,
    reliability: /\b(explain|describe|overview).*(reliab|test|stable)/,
    performance: /\b(explain|describe|overview).*(perform|speed|scale)/,
    database: /\b(explain|describe|overview).*(database|db|schema|migrat)/,
  };
  return patterns[dim]?.test(q) ?? false;
}

function buildChunks(items: GapItem[]): RepoChunk[] {
  return items.map((item, i) => {
    const text = `${item.dimension} ${item.check} ${item.detail} ${item.recommendation || ""}`;
    return { id: `chunk-${i}`, dimension: item.dimension, text, tokens: tokenize(text), item };
  });
}

function buildContextChunks(report: Record<string, unknown>): RepoChunk[] {
  const ctx = getBaselineContext(report);
  const chunks: RepoChunk[] = [];
  let i = 0;

  const structure = inferStructureSignals(ctx.paths);
  if (structure.length) {
    const text = `architecture structure layout ${structure.join(" ")}`;
    chunks.push({
      id: `ctx-structure-${i++}`,
      dimension: "architecture",
      text,
      tokens: tokenize(text),
      item: {
        dimension: "architecture",
        check: "repo_structure",
        detail: structure.join("; "),
        weight: 0,
        source: "path_scan",
        passed: true,
      },
    });
  }

  for (const node of ctx.graph.nodes) {
    const text = `architecture graph ${node.type} ${node.name}`;
    chunks.push({
      id: `ctx-node-${i++}`,
      dimension: "architecture",
      text,
      tokens: tokenize(text),
      item: {
        dimension: "architecture",
        check: `graph_${node.type.toLowerCase()}`,
        detail: `${node.type} component: ${node.name}`,
        weight: 0,
        source: "graph",
        passed: true,
      },
    });
  }

  for (const path of ctx.pathsSample.slice(0, 15)) {
    const text = `path ${path}`;
    chunks.push({
      id: `ctx-path-${i++}`,
      dimension: "architecture",
      text,
      tokens: tokenize(text),
      item: {
        dimension: "architecture",
        check: "path_signal",
        detail: path,
        weight: 0,
        source: "tree_scan",
        passed: true,
      },
    });
  }

  return chunks;
}

function retrieveChunks(query: string, chunks: RepoChunk[], limit = 4): RepoChunk[] {
  const qTokens = tokenize(query);
  const synonyms: Record<string, string[]> = {
    security: ["security", "secret", "env", "vulner", "auth", "safe"],
    reliability: ["reliab", "test", "error", "handler", "stable", "idempot"],
    performance: ["perform", "speed", "size", "build", "fast", "slow"],
    architecture: ["architect", "monorepo", "graph", "structure", "layout", "design", "explain", "component"],
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

function buildRepoAboutAnswer(
  fullName: string,
  confidence: number,
  gaps: GapItem[],
  passed: GapItem[],
  report: Record<string, unknown>,
) {
  const ctx = getBaselineContext(report);
  const purpose = inferRepoPurpose(fullName.split("/").pop() || fullName, ctx.languages, ctx.paths, ctx.services);
  const structure = inferStructureSignals(ctx.paths);
  const graphSummary = formatGraphSummary(ctx.graph);

  return {
    intent: "repo_about",
    answer: `**${fullName}** — repository intelligence from baseline scan (not generic LLM guess).

**What it does**
${purpose}

**Stack & scale**
- Languages: **${ctx.languages.join(", ") || "unknown"}**
- Files tracked: **${ctx.fileCount ?? "—"}**
- Services: **${ctx.services.join(", ") || "single package"}**
- Databases in graph: **${ctx.databases.join(", ") || "none detected"}**
- Production confidence: **${confidence}/100**

**Architecture snapshot**
${graphSummary}

**Structure signals**
${structure.length ? structure.map((s) => `• ${s}`).join("\n") : "• Standard single-package layout"}

**Health**
- **${passed.length}** checks passed · **${gaps.length}** gaps open

Ask **"explain architecture"** for a full structural breakdown, or **"security gaps"** for issues only.`,
    gaps: gaps.slice(0, 2),
    sources: ["repo_purpose", "architecture_graph", "path_structure", ...structure.slice(0, 3).map((_, i) => `structure_${i}`)],
  };
}

function buildArchitectureOverview(
  fullName: string,
  confidence: number,
  scores: Record<string, number>,
  gaps: GapItem[],
  passed: GapItem[],
  report: Record<string, unknown>,
) {
  const ctx = getBaselineContext(report);
  const archScore = scores.architecture ?? "—";
  const structure = inferStructureSignals(ctx.paths);
  const graphSummary = formatGraphSummary(ctx.graph);
  const pathSample = formatPathSample(ctx.pathsSample);
  const archPassed = passed.filter((p) => p.dimension === "architecture");
  const archGaps = gaps.filter((g) => g.dimension === "architecture");

  let healthSection = "";
  if (archPassed.length) {
    healthSection += `\n\n**Architecture checks passed**\n${archPassed.map((p) => formatItem(p, false)).join("\n")}`;
  }
  if (archGaps.length) {
    healthSection += `\n\n**Architecture gaps to address**\n${archGaps.map((g) => formatItem(g)).join("\n\n")}`;
  }

  return {
    intent: "architecture_overview",
    answer: `**Architecture overview** for **${fullName}** (score: **${archScore}/100**, confidence: **${confidence}/100**)

This answer is built from the **repository graph** and **path tree scan** generated during baseline analysis — the same structural signals AgentGuard uses for blast-radius and dependency reasoning.

${graphSummary}

**Layout & tooling**
${structure.length ? structure.map((s) => `• ${s}`).join("\n") : "• Single-package application layout"}

${pathSample}${healthSection}

**How to go deeper**
- "architecture gaps" — only failed checks
- "what security gaps exist?" — security dimension
- "how can I improve?" — prioritized fixes`,
    gaps: archGaps.slice(0, 2),
    sources: [
      "architecture_graph",
      "path_structure",
      ...ctx.graph.nodes.slice(0, 4).map((n) => `graph_${n.type.toLowerCase()}`),
      ...structure.slice(0, 3).map((_, i) => `structure_${i}`),
    ],
  };
}

export function answerRepoQuestion(
  report: Record<string, unknown>,
  question: string,
): { answer: string; gaps: GapItem[]; sources: string[]; intent: string } {
  const allEvidence = extractAllEvidence(report);
  const gaps = allEvidence.filter((e) => !e.passed);
  const passed = allEvidence.filter((e) => e.passed);
  const rubricChunks = buildChunks(allEvidence);
  const contextChunks = buildContextChunks(report);
  const chunks = [...contextChunks, ...rubricChunks];
  const q = question.toLowerCase().trim();
  const fullName = (report.full_name as string) || "this repository";
  const confidence = Number(report.production_confidence ?? (report.scores as Record<string, unknown>)?.production_confidence ?? 0);
  const scores = (report.scores as Record<string, number>) || {};

  // Purpose / what does this repo do
  if (isExplainPurpose(q)) {
    return buildRepoAboutAnswer(fullName, confidence, gaps, passed, report);
  }

  // Architecture explanation (NOT gap-only)
  if (isExplainArchitecture(q) && !isGapFocusedQuestion(q)) {
    return buildArchitectureOverview(fullName, confidence, scores, gaps, passed, report);
  }

  // Dimension explain overviews
  for (const dim of ["security", "reliability", "performance", "database"] as const) {
    if (isDimensionExplain(q, dim) && !isGapFocusedQuestion(q)) {
      const dimPassed = passed.filter((p) => p.dimension === dim);
      const dimGaps = gaps.filter((g) => g.dimension === dim);
      const dimScore = scores[dim] ?? "—";
      const passedLines = dimPassed.map((p) => formatItem(p, false)).join("\n");
      const gapLines = dimGaps.map((g) => formatItem(g)).join("\n\n");
      return {
        intent: `${dim}_overview`,
        answer: `**${dim.charAt(0).toUpperCase() + dim.slice(1)} overview** for ${fullName} (score: **${dimScore}/100**)\n\n**Signals from scan**\n${passedLines || "No passed checks recorded."}${dimGaps.length ? `\n\n**Open gaps**\n${gapLines}` : ""}`,
        gaps: dimGaps.slice(0, 3),
        sources: dimPassed.slice(0, 3).map((p) => p.check).concat(dimGaps.slice(0, 2).map((g) => g.check)),
      };
    }
  }

  // Dimension-specific GAPS (only when gap-focused or explicit gap patterns)
  for (const [dim, pattern] of Object.entries(DIM_PATTERNS)) {
    if (pattern.test(q) && (isGapFocusedQuestion(q) || /gap/.test(q))) {
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

  // Dimension match without gap focus → overview for that dimension
  for (const [dim, pattern] of Object.entries(DIM_PATTERNS)) {
    if (pattern.test(q) && !isGapFocusedQuestion(q)) {
      if (dim === "architecture") {
        return buildArchitectureOverview(fullName, confidence, scores, gaps, passed, report);
      }
      const dimPassed = passed.filter((p) => p.dimension === dim);
      const dimGaps = gaps.filter((g) => g.dimension === dim);
      const dimScore = scores[dim] ?? "—";
      return {
        intent: `${dim}_overview`,
        answer: `**${dim.charAt(0).toUpperCase() + dim.slice(1)}** for ${fullName} (score: **${dimScore}/100**)\n\n${dimPassed.map((p) => formatItem(p, false)).join("\n")}${dimGaps.length ? `\n\n**Gaps**\n${dimGaps.map((g) => formatItem(g)).join("\n\n")}` : ""}`,
        gaps: dimGaps.slice(0, 3),
        sources: [...dimPassed.slice(0, 3).map((p) => p.check), ...dimGaps.slice(0, 2).map((g) => g.check)],
      };
    }
  }

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

  if (isStrengthsQuestion(q)) {
    const top = passed.slice(0, 6).map((p) => formatItem(p, false));
    return {
      intent: "strengths",
      answer: `**Strengths** for ${fullName} (confidence: **${confidence}/100**):\n\n${top.join("\n")}\n\nScores: Security ${scores.security}, Reliability ${scores.reliability}, Performance ${scores.performance}, Architecture ${scores.architecture}, Database ${scores.database}.`,
      gaps: [],
      sources: passed.map((p) => p.check),
    };
  }

  const relevant = retrieveChunks(question, chunks, 5);
  if (relevant.length > 0) {
    const lines = relevant.map((c) => formatItem(c.item));
    return {
      intent: "retrieval",
      answer: `For **${fullName}**, based on your question and retrieved scan evidence:\n\n${lines.join("\n\n")}`,
      gaps: relevant.filter((c) => !c.item.passed).map((c) => c.item),
      sources: relevant.map((c) => c.item.check),
    };
  }

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

  return buildRepoAboutAnswer(fullName, confidence, gaps, passed, report);
}
