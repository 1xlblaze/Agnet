import { detectFindings, type Finding } from "@/lib/agentguard/engine";
import { formatRagContext, retrieveContext } from "@/lib/agentguard/rag";

export type LlmAnalysisInput = {
  prTitle: string;
  diff: string;
  blastRadius: number;
  graphJson?: string;
  staticFindings?: Finding[];
};

export type LlmProviderStatus = {
  provider: "cursor" | "heuristic";
  configured: boolean;
  reachable: boolean;
  models?: string[];
  error?: string;
};

const CURSOR_API = "https://api.cursor.com/v1";

function cursorAuthHeader(): string | null {
  const key = process.env.CURSOR_API_KEY;
  if (!key) return null;
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function checkCursorApi(): Promise<LlmProviderStatus> {
  const auth = cursorAuthHeader();
  if (!auth) {
    return { provider: "heuristic", configured: false, reachable: false, error: "CURSOR_API_KEY not set" };
  }
  try {
    const res = await fetch(`${CURSOR_API}/models`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        provider: "heuristic",
        configured: true,
        reachable: false,
        error: `Cursor API ${res.status}`,
      };
    }
    const data = (await res.json()) as { items?: { id: string }[] };
    const models = (data.items || []).map((m) => m.id).slice(0, 8);
    return { provider: "cursor", configured: true, reachable: true, models };
  } catch (e) {
    return {
      provider: "heuristic",
      configured: true,
      reachable: false,
      error: e instanceof Error ? e.message : "Cursor API unreachable",
    };
  }
}

function buildAnalysisPrompt(input: LlmAnalysisInput, ragContext: string): string {
  const staticSummary =
    input.staticFindings?.map((f) => `- ${f.severity} ${f.title}: ${f.description}`).join("\n") ||
    "none";

  return `You are an advisory security and reliability analyzer for AgentGuard.
Analyze this pull request diff and return ONLY valid JSON (no markdown fences).

Required JSON shape:
{"findings":[{"severity":"high|medium|low|critical","category":"security|reliability|performance|api|database|messaging","title":"...","description":"...","evidence":["..."],"recommendation":"...","confidence":0.0}]}

Rules:
- Output is advisory; never authorize deployment.
- Focus on idempotency, secrets, blast radius, and missing tests.
- Maximum 5 findings.

PR: ${input.prTitle}
Blast radius score: ${input.blastRadius}
Static findings already detected:
${staticSummary}

Retrieved policy context:
${ragContext || "none"}

Diff:
${input.diff.slice(0, 12000)}`;
}

async function analyzeWithCursorAgent(prompt: string): Promise<Finding[]> {
  const auth = cursorAuthHeader();
  if (!auth) return [];

  const createRes = await fetch(`${CURSOR_API}/agents`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "AgentGuard advisory scan",
      model: { id: "composer-2" },
      prompt: { text: prompt },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!createRes.ok) return [];

  const created = (await createRes.json()) as {
    agent?: { id: string };
    run?: { id: string };
  };
  const agentId = created.agent?.id;
  const runId = created.run?.id;
  if (!agentId || !runId) return [];

  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const runRes = await fetch(`${CURSOR_API}/agents/${agentId}/runs/${runId}`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(10000),
    });
    if (!runRes.ok) break;
    const run = (await runRes.json()) as { status?: string; result?: { text?: string } };
    if (run.status === "completed" || run.status === "COMPLETED") {
      const text = run.result?.text || "";
      return parseLlmFindings(text);
    }
    if (run.status === "failed" || run.status === "FAILED" || run.status === "cancelled") break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return [];
}

function parseLlmFindings(text: string): Finding[] {
  const jsonMatch = text.match(/\{[\s\S]*"findings"[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      findings?: Array<{
        severity?: string;
        category?: string;
        title?: string;
        description?: string;
        evidence?: string[];
        recommendation?: string;
        confidence?: number;
      }>;
    };
    return (parsed.findings || []).map((f) => ({
      severity: (f.severity || "medium").toUpperCase(),
      category: f.category || "reliability",
      title: f.title || "LLM finding",
      description: f.description || "",
      evidence: f.evidence || ["cursor_llm"],
      recommendation: f.recommendation || "",
      confidence: f.confidence ?? 0.75,
      status: "open",
    }));
  } catch {
    return [];
  }
}

function heuristicFindings(input: LlmAnalysisInput): Finding[] {
  const base = detectFindings(input.diff);
  const rag = retrieveContext(`${input.prTitle}\n${input.diff}`, 3);
  if (rag.some((c) => c.content.toLowerCase().includes("idempotency")) && base.length === 0) {
    const lower = input.diff.toLowerCase();
    if (lower.includes("payment") && !lower.includes("idempotency")) {
      base.push({
        severity: "MEDIUM",
        category: "reliability",
        title: "Policy context suggests idempotency review",
        description: "Retrieved AgentGuard policy context flags idempotency requirements for payment paths.",
        evidence: rag.map((c) => c.title),
        recommendation: "Verify idempotency keys on all side-effecting payment writes.",
        confidence: 0.72,
        status: "open",
      });
    }
  }
  return base;
}

export async function analyzeWithLlm(input: LlmAnalysisInput): Promise<{
  findings: Finding[];
  provider: LlmProviderStatus["provider"];
  ragChunks: number;
}> {
  const rag = retrieveContext(`${input.prTitle}\n${input.diff}`, 5);
  const ragContext = formatRagContext(rag);
  const status = await checkCursorApi();

  if (status.reachable) {
    const prompt = buildAnalysisPrompt({ ...input, staticFindings: input.staticFindings || detectFindings(input.diff) }, ragContext);
    const cursorFindings = await analyzeWithCursorAgent(prompt);
    if (cursorFindings.length > 0) {
      return { findings: cursorFindings, provider: "cursor", ragChunks: rag.length };
    }
  }

  return {
    findings: heuristicFindings(input),
    provider: "heuristic",
    ragChunks: rag.length,
  };
}
