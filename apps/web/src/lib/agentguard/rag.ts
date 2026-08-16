import { readFileSync, existsSync } from "fs";
import { join } from "path";

export type KnowledgeChunk = {
  id: string;
  source: string;
  title: string;
  content: string;
  tokens: Set<string>;
};

export type RetrievedChunk = KnowledgeChunk & { score: number };

const ROOT = join(process.cwd(), "..", "..");

const KNOWLEDGE_SOURCES = [
  { path: "AGENTGUARD.md", title: "AgentGuard Master Spec" },
  { path: "docs/10-risk-engine.md", title: "Risk Engine" },
  { path: "docs/16-policy-engine.md", title: "Policy Engine" },
  { path: "docs/11-verification-engine.md", title: "Verification Engine" },
  { path: "docs/18-security.md", title: "Security Model" },
  { path: "docs/09-blast-radius.md", title: "Blast Radius" },
  { path: "docs/08-architecture-graph.md", title: "Architecture Graph" },
];

let index: KnowledgeChunk[] | null = null;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function chunkMarkdown(source: string, title: string, raw: string): KnowledgeChunk[] {
  const sections = raw.split(/^#{1,3}\s+/m).filter(Boolean);
  return sections.map((section, i) => {
    const lines = section.trim().split("\n");
    const heading = lines[0]?.trim() || title;
    const content = lines.slice(1).join("\n").trim() || section.trim();
    const id = `${source}#${i}`;
    return {
      id,
      source,
      title: `${title} — ${heading}`.slice(0, 120),
      content: content.slice(0, 2000),
      tokens: tokenize(`${heading} ${content}`),
    };
  });
}

export function buildKnowledgeIndex(): KnowledgeChunk[] {
  if (index) return index;
  const chunks: KnowledgeChunk[] = [];
  for (const src of KNOWLEDGE_SOURCES) {
    const full = join(ROOT, src.path);
    if (!existsSync(full)) continue;
    try {
      const raw = readFileSync(full, "utf8");
      chunks.push(...chunkMarkdown(src.path, src.title, raw));
    } catch {
      /* skip unreadable */
    }
  }
  index = chunks.length > 0 ? chunks : getFallbackChunks();
  return index;
}

function getFallbackChunks(): KnowledgeChunk[] {
  const fallback = [
    {
      source: "builtin",
      title: "Idempotency Policy",
      content:
        "Payment retry paths must use idempotency keys. Duplicate writes without idempotency are HIGH reliability findings. Policy engine blocks deploy when HIGH findings are open.",
    },
    {
      source: "builtin",
      title: "LLM Trust Model",
      content:
        "LLM output is advisory only. The deterministic policy engine has final authority over ALLOW, BLOCK, and HUMAN_APPROVAL decisions.",
    },
    {
      source: "builtin",
      title: "Secret Detection",
      content:
        "Hardcoded passwords, api_key literals, and secret= assignments are CRITICAL security findings that block deployment.",
    },
  ];
  return fallback.map((f, i) => ({
    id: `builtin-${i}`,
    source: f.source,
    title: f.title,
    content: f.content,
    tokens: tokenize(`${f.title} ${f.content}`),
  }));
}

export function retrieveContext(query: string, limit = 5): RetrievedChunk[] {
  const qTokens = tokenize(query);
  if (qTokens.size === 0) return [];

  const scored = buildKnowledgeIndex()
    .map((chunk) => {
      let overlap = 0;
      for (const t of qTokens) {
        if (chunk.tokens.has(t)) overlap++;
      }
      const score = overlap / Math.sqrt(qTokens.size * chunk.tokens.size || 1);
      return { ...chunk, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function formatRagContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks.map((c) => `### ${c.title}\n${c.content}`).join("\n\n");
}

export function ragStatus() {
  const chunks = buildKnowledgeIndex();
  return {
    status: chunks.length > 0 ? "ready" : "empty",
    chunks: chunks.length,
    sources: [...new Set(chunks.map((c) => c.source))],
  };
}
