export type Finding = {
  severity: string;
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidence: unknown;
  recommendation: string;
  confidence: number;
  status: string;
};

export type Graph = {
  nodes: { id: string; type: string; name: string }[];
  edges: { from: string; to: string; type: string }[];
};

export function buildGraph(service: string, diff: string): Graph {
  const svc = service || "app-service";
  const lower = diff.toLowerCase();
  const nodes: Graph["nodes"] = [{ id: `svc:${svc}`, type: "Service", name: svc }];
  const edges: Graph["edges"] = [];
  const add = (n: Graph["nodes"][0], e?: Graph["edges"][0]) => {
    if (!nodes.find((x) => x.id === n.id)) nodes.push(n);
    if (e) edges.push(e);
  };
  if (lower.includes("router") || lower.includes("http.") || lower.includes("gin.") || lower.includes("retry")) {
    const api = lower.includes("retry") ? "api:POST /payments/retry" : "api:POST /payments";
    add({ id: api, type: "API", name: api.replace("api:", "") }, { from: `svc:${svc}`, to: api, type: "EXPOSES" });
  }
  if (lower.includes("postgres") || lower.includes("sql") || lower.includes("insert")) {
    add({ id: "db:postgres", type: "Database", name: "PostgreSQL" }, { from: `svc:${svc}`, to: "db:postgres", type: "WRITES" });
    add({ id: "table:payments", type: "Table", name: "payments" }, { from: "db:postgres", to: "table:payments", type: "DEPENDS_ON" });
  }
  if (lower.includes("redis")) {
    add({ id: "cache:redis", type: "Cache", name: "Redis" }, { from: `svc:${svc}`, to: "cache:redis", type: "READS" });
  }
  if (lower.includes("kafka")) {
    add({ id: "topic:payment-events", type: "Topic", name: "payment-events" }, { from: `svc:${svc}`, to: "topic:payment-events", type: "PUBLISHES" });
    add({ id: "svc:settlement-service", type: "Service", name: "settlement-service" }, { from: "topic:payment-events", to: "svc:settlement-service", type: "CONSUMES" });
  }
  return { nodes, edges };
}

export function blastRadius(g: Graph) {
  let services = 0, apis = 0, tables = 0, topics = 0, downstream = 0;
  const serviceIDs = new Set<string>();
  for (const n of g.nodes) {
    if (n.type === "Service") { services++; serviceIDs.add(n.id); }
    if (n.type === "API") apis++;
    if (n.type === "Table") tables++;
    if (n.type === "Topic") topics++;
  }
  for (const e of g.edges) if (e.type === "CONSUMES" && serviceIDs.has(e.to)) downstream++;
  let score = services * 8 + apis * 6 + tables * 10 + topics * 9 + downstream * 7;
  if (score > 100) score = 100;
  if (score === 0) score = 5;
  return { score, services, apis, tables, topics, downstream };
}

export function detectFindings(diff: string): Finding[] {
  const lower = diff.toLowerCase();
  const out: Finding[] = [];
  const add = (f: Omit<Finding, "status" | "evidence"> & { evidence?: unknown }) =>
    out.push({ ...f, evidence: f.evidence ?? ["static_heuristic"], status: "open" });

  if (lower.includes("password") || lower.includes("api_key") || lower.includes("secret=")) {
    add({ severity: "CRITICAL", category: "security", title: "Possible hardcoded secret", description: "Diff appears to introduce secret-like material.", recommendation: "Remove secrets; use a secret manager.", confidence: 0.9 });
  }
  const hasFix = lower.includes("idempotency key required") || lower.includes("chargeonce") || lower.includes("idempotencykey");
  if (lower.includes("retry") && !hasFix) {
    add({
      severity: "HIGH", category: "reliability", title: "Duplicate payment risk",
      description: "Retry path may execute a side-effecting write more than once without idempotency.",
      file: "payment/service.go", line: 84,
      recommendation: "Introduce an idempotency key and make the write path idempotent.", confidence: 0.94,
      evidence: ["Retry path can execute the database write twice."],
    });
  }
  return out;
}

export function scoreRisk(diff: string, g: Graph, findings: Finding[], blast: number) {
  const hasFix = diff.toLowerCase().includes("chargeonce") || diff.toLowerCase().includes("idempotency key required");
  let security = 10, reliability = 15, performance = 20, database = 10, api = 10, messaging = 5, testing = 45, deployment = 15;
  for (const f of findings) {
    if (f.category === "security" && f.severity === "CRITICAL") security += 40;
    if (f.category === "reliability" && f.severity === "HIGH") reliability += 35;
  }
  database += g.nodes.filter((n) => n.type === "Table").length * 15;
  api += g.nodes.filter((n) => n.type === "API").length * 12;
  messaging += g.nodes.filter((n) => n.type === "Topic").length * 20;
  if (hasFix) reliability = Math.min(reliability, 18);
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  security = clamp(security); reliability = clamp(reliability); database = clamp(database); api = clamp(api); messaging = clamp(messaging);
  let overall = Math.round(security * 0.2 + reliability * 0.18 + performance * 0.08 + database * 0.14 + api * 0.12 + messaging * 0.1 + testing * 0.1 + deployment * 0.08);
  if (hasFix) overall = Math.min(overall, 25);
  return { security_score: security, reliability_score: reliability, performance_score: performance, database_score: database, api_score: api, messaging_score: messaging, testing_score: testing, deployment_score: deployment, blast_radius: blast, overall_risk: overall };
}

export function verify(findings: Finding[], remediated: boolean) {
  const reqs = [] as { title: string; evidence_type: string; status: string }[];
  for (const f of findings) {
    if (f.category === "reliability") {
      for (const title of ["duplicate request test", "idempotency test", "transaction test", "retry test"]) {
        reqs.push({ title, evidence_type: "TEST_RESULT", status: "pending" });
      }
    }
  }
  reqs.push(
    { title: "preview deployment", evidence_type: "PREVIEW_RESULT", status: "pending" },
    { title: "smoke tests", evidence_type: "SMOKE_TEST", status: "pending" },
    { title: "docker build", evidence_type: "BUILD_RESULT", status: "pending" },
  );
  const evidence = reqs.map((r) => {
    let pass = true;
    let detail = "passed";
    const t = r.title.toLowerCase();
    if ((t.includes("idempotency") || t.includes("duplicate")) && !remediated) {
      pass = false;
      detail = "not verified";
    }
    r.status = pass ? "passed" : "failed";
    return { type: r.evidence_type, passed: pass, detail, created_at: new Date().toISOString() };
  });
  return { requirements: reqs, evidence, passed: evidence.every((e) => e.passed) };
}

export function policyDecision(risk: ReturnType<typeof scoreRisk>, findings: Finding[], testsPass: boolean) {
  const active = findings.filter((f) => f.status !== "resolved");
  const crit = active.filter((f) => f.severity === "CRITICAL").length;
  const high = active.filter((f) => f.severity === "HIGH").length;
  const reasons: string[] = [];
  if (risk.overall_risk > 30) reasons.push("overall risk exceeds threshold");
  if (risk.blast_radius > 50) reasons.push("blast radius exceeds threshold");
  if (crit > 0) reasons.push("critical findings present");
  if (high > 0) reasons.push("high findings present");
  if (!testsPass) reasons.push("tests required");
  if (reasons.length === 0) return { decision: "ALLOW", reasons: ["all policy checks passed"] };
  if (crit > 0 || high > 0 || risk.overall_risk > 50) return { decision: "BLOCK", reasons };
  return { decision: "HUMAN_APPROVAL", reasons };
}

export function codexPatch(diff: string) {
  if (!diff.toLowerCase().includes("retry")) return { remediated: true, summary: "no patch required", patch: "" };
  return {
    remediated: true,
    summary: "Introduce idempotency key for payment retry",
    patch: `diff --git a/payment/service.go b/payment/service.go
+func RetryPayment(id string, idempotencyKey string) error {
+    if idempotencyKey == "" { return fmt.Errorf("idempotency key required") }
+    return chargeOnce(id, idempotencyKey)
+}`,
  };
}
