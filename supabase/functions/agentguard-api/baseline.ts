import type { AstIndex } from "./ast-extract.ts";

type Graph = {
  nodes: { id: string; type: string; name: string }[];
  edges: { from: string; to: string; type: string }[];
};

type Evidence = {
  check: string;
  detail: string;
  passed: boolean;
  source: string;
  weight: number;
};

type DimensionScore = {
  score: number;
  evidence: Evidence[];
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function dimScore(evidence: Evidence[]) {
  const total = evidence.reduce((s, e) => s + e.weight, 0);
  const earned = evidence.reduce((s, e) => s + (e.passed ? e.weight : 0), 0);
  return clamp(total ? Math.round((earned / total) * 100) : 50);
}

function hasPath(paths: string[], pattern: RegExp) {
  return paths.some((p) => pattern.test(p));
}

export function buildGraphFromPaths(service: string, paths: string[]): Graph {
  const svc = service || "app-service";
  const nodes: Graph["nodes"] = [{ id: `svc:${svc}`, type: "Service", name: svc }];
  const edges: Graph["edges"] = [];
  const lower = paths.join("\n").toLowerCase();

  const add = (n: Graph["nodes"][0], e?: Graph["edges"][0]) => {
    if (!nodes.find((x) => x.id === n.id)) nodes.push(n);
    if (e) edges.push(e);
  };

  if (/dockerfile|docker-compose|\.github\/workflows/.test(lower)) {
    add({ id: "infra:docker", type: "Infra", name: "Docker" }, { from: `svc:${svc}`, to: "infra:docker", type: "DEPENDS_ON" });
  }
  if (/postgres|mysql|sqlite|mongodb|prisma|drizzle|typeorm|sequelize/.test(lower)) {
    add({ id: "db:primary", type: "Database", name: "Primary DB" }, { from: `svc:${svc}`, to: "db:primary", type: "WRITES" });
  }
  if (/redis|memcached/.test(lower)) {
    add({ id: "cache:redis", type: "Cache", name: "Redis" }, { from: `svc:${svc}`, to: "cache:redis", type: "READS" });
  }
  if (/kafka|rabbitmq|nats|sqs/.test(lower)) {
    add({ id: "topic:events", type: "Topic", name: "events" }, { from: `svc:${svc}`, to: "topic:events", type: "PUBLISHES" });
  }
  if (/route\.ts|router\.|api\/|handlers\/|controller/.test(lower)) {
    add({ id: "api:http", type: "API", name: "HTTP API" }, { from: `svc:${svc}`, to: "api:http", type: "EXPOSES" });
  }

  return { nodes, edges };
}

export function scoreBaseline(paths: string[], graph: Graph, languages: Record<string, number>) {
  const fileCount = paths.length;
  const langNames = Object.keys(languages);
  const langCount = langNames.length;
  const dbNodes = graph.nodes.filter((n) => n.type === "Database").length;
  const apiNodes = graph.nodes.filter((n) => n.type === "API").length;
  const serviceNodes = graph.nodes.filter((n) => n.type === "Service").length;

  const security: Evidence[] = [
    {
      check: "no_env_in_repo",
      detail: hasPath(paths, /(^|\/)\.env(\.|$)/) ? "Tracked .env files found in repository tree." : "No tracked .env files in repository tree.",
      passed: !hasPath(paths, /(^|\/)\.env(\.|$)/),
      source: "tree_scan",
      weight: 18,
    },
    {
      check: "dependency_lockfile",
      detail: hasPath(paths, /package-lock\.json|yarn\.lock|pnpm-lock\.yaml|go\.sum|poetry\.lock|Cargo\.lock|Gemfile\.lock/)
        ? "Dependency lockfile detected."
        : "No dependency lockfile detected.",
      passed: hasPath(paths, /package-lock\.json|yarn\.lock|pnpm-lock\.yaml|go\.sum|poetry\.lock|Cargo\.lock|Gemfile\.lock/),
      source: "tree_scan",
      weight: 8,
    },
    {
      check: "ci_workflow",
      detail: hasPath(paths, /\.github\/workflows\//) ? "CI workflow directory detected." : "No CI workflow directory detected.",
      passed: hasPath(paths, /\.github\/workflows\//),
      source: "tree_scan",
      weight: 10,
    },
    {
      check: "no_unsafe_sinks_in_tree",
      detail: hasPath(paths, /eval\(|dangerouslySetInnerHTML/) ? "Unsafe sink patterns detected in paths." : "No obvious eval or dangerouslySetInnerHTML in tree paths.",
      passed: !hasPath(paths, /eval\(|dangerouslySetInnerHTML/),
      source: "tree_scan",
      weight: 12,
    },
  ];

  const database: Evidence[] = [
    {
      check: "schema_migrations",
      detail: hasPath(paths, /migrations?\/|db\/migrate|prisma\/migrations/) ? "Migration directory detected." : "No migration directory found.",
      passed: hasPath(paths, /migrations?\/|db\/migrate|prisma\/migrations/),
      source: "tree_scan",
      weight: 18,
    },
    {
      check: "single_primary_db",
      detail: `${dbNodes} database node(s) in architecture graph.`,
      passed: dbNodes <= 2,
      source: "graph",
      weight: 10,
    },
    {
      check: "orm_or_query_layer",
      detail: hasPath(paths, /prisma|drizzle|typeorm|sequelize|sqlalchemy|gorm/) ? "ORM/query-layer signals in repository paths." : "No ORM/query-layer signals in repository paths.",
      passed: hasPath(paths, /prisma|drizzle|typeorm|sequelize|sqlalchemy|gorm/),
      source: "tree_scan",
      weight: 8,
    },
  ];

  const performance: Evidence[] = [
    {
      check: "repo_size",
      detail: fileCount > 500 ? `${fileCount} tracked files — large repo.` : `${fileCount} tracked files — moderate size.`,
      passed: fileCount <= 500,
      source: "baseline",
      weight: 15,
    },
    {
      check: "language_diversity",
      detail: `${langCount} primary language(s) detected.`,
      passed: langCount <= 4,
      source: "baseline",
      weight: 8,
    },
    {
      check: "build_config",
      detail: hasPath(paths, /Dockerfile|docker-compose|Makefile|build\.gradle|pom\.xml|tsconfig\.json|next\.config/)
        ? "Build configuration files detected."
        : "No obvious build configuration files.",
      passed: hasPath(paths, /Dockerfile|docker-compose|Makefile|build\.gradle|pom\.xml|tsconfig\.json|next\.config/),
      source: "tree_scan",
      weight: 7,
    },
  ];

  const reliability: Evidence[] = [
    {
      check: "automated_tests",
      detail: hasPath(paths, /test|spec|__tests__|_test\.go|\.test\.|\.spec\./) ? "Test files detected in repository tree." : "No test files detected in repository tree.",
      passed: hasPath(paths, /test|spec|__tests__|_test\.go|\.test\.|\.spec\./),
      source: "tree_scan",
      weight: 20,
    },
    {
      check: "service_count_bounded",
      detail: `${serviceNodes} service node(s) in architecture graph.`,
      passed: serviceNodes <= 5,
      source: "graph",
      weight: 10,
    },
    {
      check: "error_handling_signals",
      detail: hasPath(paths, /error|exception|handler|middleware/) ? "Error-handling patterns found in path names." : "No error-handling patterns found in path names.",
      passed: hasPath(paths, /error|exception|handler|middleware/),
      source: "tree_scan",
      weight: 8,
    },
  ];

  const architecture: Evidence[] = [
    {
      check: "graph_complexity",
      detail: `${graph.nodes.length} nodes, ${graph.edges.length} edges in dependency graph.`,
      passed: graph.nodes.length <= 20,
      source: "graph",
      weight: 14,
    },
    {
      check: "api_surface",
      detail: `${apiNodes} API node(s) exposed in graph.`,
      passed: apiNodes <= 10,
      source: "graph",
      weight: 8,
    },
    {
      check: "monorepo_structure",
      detail: hasPath(paths, /^apps\/|^packages\//) ? "Monorepo layout detected (apps/ or packages/)." : "Single-package layout (no apps/ or packages/ root).",
      passed: hasPath(paths, /^apps\/|^packages\//),
      source: "tree_scan",
      weight: 6,
    },
  ];

  const securityScore = dimScore(security);
  const databaseScore = dimScore(database);
  const performanceScore = dimScore(performance);
  const reliabilityScore = dimScore(reliability);
  const architectureScore = dimScore(architecture);
  const productionConfidence = Math.round(
    (securityScore + databaseScore + performanceScore + reliabilityScore + architectureScore) / 5,
  );

  return {
    security: { score: securityScore, evidence: security },
    database: { score: databaseScore, evidence: database },
    performance: { score: performanceScore, evidence: performance },
    reliability: { score: reliabilityScore, evidence: reliability },
    architecture: { score: architectureScore, evidence: architecture },
    meta: {
      apis: apiNodes,
      services: serviceNodes,
      databases: dbNodes,
      languages: langCount,
      edge_count: graph.edges.length,
      file_count: fileCount,
      node_count: graph.nodes.length,
    },
    rubric_version: "v2",
    production_confidence: productionConfidence,
  };
}

export async function fetchGitHubRepo(owner: string, name: string) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "AgentGuard-Baseline/1.0" };
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
  if (!repoRes.ok) throw new Error(`GitHub repo not found: ${owner}/${name} (${repoRes.status})`);
  const repo = await repoRes.json();

  const [langRes, treeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${name}/git/trees/${repo.default_branch}?recursive=1`, { headers }),
  ]);

  const languages = langRes.ok ? await langRes.json() : {};
  let paths: string[] = [];
  if (treeRes.ok) {
    const tree = await treeRes.json();
    paths = (tree.tree || []).filter((t: { type: string }) => t.type === "blob").map((t: { path: string }) => t.path);
  }

  return { repo, languages, paths };
}

export function buildBaselineDocument(input: {
  repositoryId: string;
  owner: string;
  name: string;
  paths: string[];
  languages: Record<string, number>;
  graph?: Graph;
  ast?: AstIndex;
}) {
  const { repositoryId, owner, name, paths, languages, ast } = input;
  const fullName = `${owner}/${name}`;
  const githubUrl = `https://github.com/${fullName}`;
  const graph = input.graph ?? buildGraphFromPaths(name, paths);
  const scores = scoreBaseline(paths, graph, languages);
  const langNames = Object.keys(languages);
  const tableNodes = graph.nodes.filter((n) => n.type === "Table").map((n) => n.name);
  const dbNodes = graph.nodes.filter((n) => n.type === "Database").map((n) => n.name);
  const databases = [...new Set([...dbNodes, ...tableNodes])];
  const services = graph.nodes.filter((n) => n.type === "Service").map((n) => n.name);
  const scannedAt = new Date().toISOString();

  const baselineInfo = {
    github: githubUrl,
    services,
    databases,
    languages: langNames,
    file_count: paths.length,
    paths_sample: paths.slice(0, 20),
    language_bytes: languages,
    ast_symbols: ast?.symbols?.length ?? 0,
    ast_files_parsed: ast?.files_parsed ?? 0,
  };

  const baselineDoc = {
    name,
    owner,
    full_name: fullName,
    github_url: githubUrl,
    repository_id: repositoryId,
    scanned_at: scannedAt,
    rubric_version: "v2",
    graph,
    scores,
    baseline: baselineInfo,
    ast: ast ?? null,
  };

  const summaryDoc = {
    name,
    owner,
    full_name: fullName,
    github_url: githubUrl,
    repository_id: repositoryId,
    rubric_version: "v2",
    production_confidence: scores.production_confidence,
    baseline_health: scores.production_confidence,
    latest_pr: null,
    scores: {
      security: scores.security.score,
      reliability: scores.reliability.score,
      performance: scores.performance.score,
      architecture: scores.architecture.score,
      database: scores.database.score,
      rubric_version: "v2",
      production_confidence: scores.production_confidence,
      baseline_health: scores.production_confidence,
      blend: null,
      pr_risk: null,
      dimensions: {
        security: scores.security,
        reliability: scores.reliability,
        performance: scores.performance,
        architecture: scores.architecture,
        database: scores.database,
      },
    },
    baseline: baselineDoc,
  };

  return { baselineDoc, summaryDoc };
}
