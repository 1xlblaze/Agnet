/**
 * Static symbol extraction for baseline scans (edge-compatible).
 * Tree-sitter-quality goals without native bindings: fetch key files from GitHub
 * and extract packages, functions, imports, SQL tables.
 *
 * Output schema aligns with knowledge-graph concepts (EXTRACTED edges) so a future
 * Graphify or go-tree-sitter worker can replace this extractor without DB changes.
 */

export type AstSymbol = {
  id: string;
  file: string;
  kind: "package" | "function" | "method" | "class" | "interface" | "type" | "table" | "module";
  name: string;
  exported: boolean;
  line: number;
  signature?: string;
  source: "EXTRACTED";
};

export type AstEdge = {
  from: string;
  to: string;
  type: "IMPORTS" | "CALLS" | "DEFINES" | "REFERENCES";
  source: "EXTRACTED" | "INFERRED";
  confidence: number;
};

export type AstChunk = {
  id: string;
  file: string;
  symbol_id?: string;
  text: string;
  dimension: string;
};

export type AstIndex = {
  version: "v1";
  extractor: "agentguard-static-outline";
  symbols: AstSymbol[];
  edges: AstEdge[];
  chunks: AstChunk[];
  files_parsed: number;
  files_skipped: number;
  files_total_candidates: number;
};

type Graph = {
  nodes: { id: string; type: string; name: string }[];
  edges: { from: string; to: string; type: string }[];
};

const MAX_FILES = 55;
const MAX_FILE_BYTES = 120_000;
const CONCURRENCY = 12;

const SKIP_PATH = /(?:^|\/)(node_modules|vendor|dist|\.next|coverage|__pycache__|\.git)(\/|$)/;
const SOURCE_EXT = /\.(go|ts|tsx|js|jsx|sql)$/i;

function scorePath(path: string): number {
  if (SKIP_PATH.test(path)) return -1000;
  let s = 0;
  if (/^(cmd|internal|pkg|src|app|apps|pages|api|lib|services|deploy)\//.test(path)) s += 12;
  if (/main\.(go|ts|tsx|js)$/.test(path)) s += 25;
  if (/route|handler|controller|service|middleware|worker/.test(path)) s += 10;
  if (/\.go$/.test(path) && !/_test\.go$/.test(path)) s += 6;
  if (/\.(ts|tsx)$/.test(path) && !/\.(test|spec)\./.test(path)) s += 6;
  if (/migrations?\/.*\.sql$/i.test(path)) s += 18;
  if (/README|AGENTS|CLAUDE/i.test(path)) s += 4;
  if (path.length < 80) s += 2;
  return s;
}

function pickFiles(paths: string[]): string[] {
  const candidates = paths.filter((p) => SOURCE_EXT.test(p) && !SKIP_PATH.test(p));
  const ranked = candidates
    .map((path) => ({ path, score: scorePath(path) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, MAX_FILES).map((x) => x.path);
}

async function fetchFileContent(owner: string, name: string, path: string): Promise<string | null> {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "AgentGuard-AST/1.0" };
  const url = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) return null;
  const raw = atob(data.content.replace(/\n/g, ""));
  if (raw.length > MAX_FILE_BYTES) return raw.slice(0, MAX_FILE_BYTES);
  return raw;
}

async function mapPool<T, R>(items: T[], fn: (item: T) => Promise<R>, limit: number): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function symId(file: string, kind: string, name: string): string {
  return `${file}::${kind}::${name}`;
}

function extractGo(content: string, file: string, symbols: AstSymbol[], edges: AstEdge[]) {
  const pkg = content.match(/^package\s+(\w+)/m);
  if (pkg) {
    const id = symId(file, "package", pkg[1]);
    symbols.push({
      id,
      file,
      kind: "package",
      name: pkg[1],
      exported: true,
      line: 1,
      source: "EXTRACTED",
    });
  }

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fn = line.match(/^func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/);
    if (fn) {
      const exported = /^func\s+[A-Z]/.test(line) || /^func\s+\([^)]*\)\s+[A-Z]/.test(line);
      const id = symId(file, "function", fn[1]);
      symbols.push({
        id,
        file,
        kind: "function",
        name: fn[1],
        exported,
        line: i + 1,
        signature: line.trim().slice(0, 120),
        source: "EXTRACTED",
      });
      if (pkg) {
        edges.push({
          from: symId(file, "package", pkg[1]),
          to: id,
          type: "DEFINES",
          source: "EXTRACTED",
          confidence: 1,
        });
      }
    }
    const typ = line.match(/^type\s+(\w+)\s+(struct|interface)/);
    if (typ) {
      symbols.push({
        id: symId(file, "type", typ[1]),
        file,
        kind: typ[2] === "interface" ? "interface" : "type",
        name: typ[1],
        exported: /^type\s+[A-Z]/.test(line),
        line: i + 1,
        source: "EXTRACTED",
      });
    }
    const imp = line.match(/^\s*"([^"]+)"/);
    if (imp && lines[i - 1]?.includes("import")) {
      edges.push({
        from: file,
        to: imp[1],
        type: "IMPORTS",
        source: "EXTRACTED",
        confidence: 1,
      });
    }
  }
}

function extractTs(content: string, file: string, symbols: AstSymbol[], edges: AstEdge[]) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const expFn = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
    if (expFn) {
      symbols.push({
        id: symId(file, "function", expFn[1]),
        file,
        kind: "function",
        name: expFn[1],
        exported: true,
        line: i + 1,
        signature: line.trim().slice(0, 120),
        source: "EXTRACTED",
      });
    }
    const expClass = line.match(/export\s+(?:default\s+)?class\s+(\w+)/);
    if (expClass) {
      symbols.push({
        id: symId(file, "class", expClass[1]),
        file,
        kind: "class",
        name: expClass[1],
        exported: true,
        line: i + 1,
        source: "EXTRACTED",
      });
    }
    const expIface = line.match(/export\s+(?:type\s+)?interface\s+(\w+)/);
    if (expIface) {
      symbols.push({
        id: symId(file, "interface", expIface[1]),
        file,
        kind: "interface",
        name: expIface[1],
        exported: true,
        line: i + 1,
        source: "EXTRACTED",
      });
    }
    const imp = line.match(/from\s+['"]([^'"]+)['"]/);
    if (imp && /import\s/.test(line)) {
      edges.push({ from: file, to: imp[1], type: "IMPORTS", source: "EXTRACTED", confidence: 1 });
    }
    const route = line.match(/(?:app\.(get|post|put|delete)|router\.(get|post))\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (route) {
      const method = (route[1] || route[2] || "get").toUpperCase();
      const routePath = route[3];
      symbols.push({
        id: symId(file, "function", `route:${routePath}`),
        file,
        kind: "function",
        name: `${method} ${routePath}`,
        exported: true,
        line: i + 1,
        source: "EXTRACTED",
      });
    }
  }
}

function extractSql(content: string, file: string, symbols: AstSymbol[]) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
    if (m) {
      const name = m[1].replace(/"/g, "");
      symbols.push({
        id: symId(file, "table", name),
        file,
        kind: "table",
        name,
        exported: true,
        line: i + 1,
        source: "EXTRACTED",
      });
    }
  }
}

function extractFile(path: string, content: string, symbols: AstSymbol[], edges: AstEdge[]) {
  if (path.endsWith(".go")) extractGo(content, path, symbols, edges);
  else if (/\.(ts|tsx|js|jsx)$/.test(path)) extractTs(content, path, symbols, edges);
  else if (path.endsWith(".sql")) extractSql(content, path, symbols);
}

function buildChunks(symbols: AstSymbol[], edges: AstEdge[]): AstChunk[] {
  const chunks: AstChunk[] = [];
  const importsByFile = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type !== "IMPORTS") continue;
    const list = importsByFile.get(e.from) || [];
    list.push(e.to);
    importsByFile.set(e.from, list);
  }

  for (const s of symbols) {
    const imports = importsByFile.get(s.file)?.slice(0, 6).join(", ") || "";
    const text = [
      `${s.kind} ${s.name}`,
      `file: ${s.file}`,
      s.signature ? `signature: ${s.signature}` : "",
      imports ? `imports: ${imports}` : "",
      s.exported ? "exported" : "internal",
    ]
      .filter(Boolean)
      .join(" · ");

    chunks.push({
      id: `ast-${s.id}`,
      file: s.file,
      symbol_id: s.id,
      text,
      dimension: s.kind === "table" ? "database" : "architecture",
    });
  }

  // Module-level summary chunk per top directory
  const dirs = new Map<string, AstSymbol[]>();
  for (const s of symbols) {
    const dir = s.file.includes("/") ? s.file.split("/")[0] : "root";
    const list = dirs.get(dir) || [];
    list.push(s);
    dirs.set(dir, list);
  }
  for (const [dir, syms] of dirs) {
    const names = syms.slice(0, 12).map((s) => `${s.kind}:${s.name}`).join(", ");
    chunks.push({
      id: `ast-module-${dir}`,
      file: dir,
      text: `Module ${dir} symbols: ${names}`,
      dimension: "architecture",
    });
  }

  return chunks;
}

function mergeAstIntoGraph(graph: Graph, ast: AstIndex, serviceName: string): Graph {
  const g: Graph = {
    nodes: [...graph.nodes],
    edges: [...graph.edges],
  };

  const addNode = (id: string, type: string, name: string) => {
    if (!g.nodes.find((n) => n.id === id)) g.nodes.push({ id, type, name });
  };
  const addEdge = (from: string, to: string, type: string) => {
    g.edges.push({ from, to, type });
  };

  addNode(`svc:${serviceName}`, "Service", serviceName);

  for (const s of ast.symbols) {
    if (s.kind === "table") {
      addNode(`table:${s.name}`, "Table", s.name);
      addEdge(`svc:${serviceName}`, `table:${s.name}`, "WRITES");
    } else if (s.kind === "function" && s.exported && s.name.startsWith("route:")) {
      addNode(`api:${s.name}`, "API", s.name.replace("route:", ""));
      addEdge(`svc:${serviceName}`, `api:${s.name}`, "EXPOSES");
    } else if (s.kind === "package") {
      addNode(`mod:${s.name}`, "Module", s.name);
      addEdge(`svc:${serviceName}`, `mod:${s.name}`, "DEPENDS_ON");
    }
  }

  for (const e of ast.edges) {
    if (e.type === "IMPORTS" && e.confidence >= 0.9) {
      addNode(`dep:${e.to}`, "Dependency", e.to);
      addEdge(`svc:${serviceName}`, `dep:${e.to}`, "DEPENDS_ON");
    }
  }

  return g;
}

export async function extractAstFromPaths(
  owner: string,
  name: string,
  paths: string[],
  serviceName: string,
  baseGraph: Graph,
): Promise<{ ast: AstIndex; graph: Graph }> {
  const selected = pickFiles(paths);
  const symbols: AstSymbol[] = [];
  const edges: AstEdge[] = [];

  const contents = await mapPool(
    selected,
    async (path) => {
      const content = await fetchFileContent(owner, name, path);
      return { path, content };
    },
    CONCURRENCY,
  );

  let parsed = 0;
  let skipped = 0;
  for (const { path, content } of contents) {
    if (!content) {
      skipped++;
      continue;
    }
    extractFile(path, content, symbols, edges);
    parsed++;
  }

  const ast: AstIndex = {
    version: "v1",
    extractor: "agentguard-static-outline",
    symbols,
    edges,
    chunks: buildChunks(symbols, edges),
    files_parsed: parsed,
    files_skipped: skipped,
    files_total_candidates: selected.length,
  };

  const graph = mergeAstIntoGraph(baseGraph, ast, serviceName);
  return { ast, graph };
}
