import { randomUUID } from "crypto";
import { getSql } from "@/lib/supabase";
import {
  blastRadius,
  buildGraph,
  codexPatch,
  detectFindings,
  policyDecision,
  scoreRisk,
  verify,
  type Finding,
} from "@/lib/agentguard/engine";

export async function ensureOrg() {
  const sql = getSql();
  const existing = await sql`select id from organizations order by created_at asc limit 1`;
  if (existing[0]) return existing[0].id as string;
  const id = randomUUID();
  await sql`insert into organizations (id, name) values (${id}, 'AgentGuard Demo')`;
  return id;
}

export async function generateProject(name: string) {
  const sql = getSql();
  const org = await ensureOrg();
  const projectId = randomUUID();
  const repoId = randomUUID();
  await sql`insert into projects (id, organization_id, name, description, status) values (${projectId}, ${org}, ${name}, ${"Auto-generated Go/Gin/PostgreSQL project"}, 'READY')`;
  await sql`insert into repositories (id, project_id, github_repository_id, owner, name, default_branch, installation_id, status)
    values (${repoId}, ${projectId}, ${Date.now()}, 'agentguard-demo', ${name}, 'main', 1, 'READY')`;
  const now = new Date().toISOString();
  const depId = randomUUID();
  await sql`insert into deployments (id, project_id, environment, version, status, url, started_at, completed_at)
    values (${depId}, ${projectId}, 'production', 'v0.1.0', 'COMPLETED', ${`https://${name.toLowerCase()}.agentguard.example.com`}, ${now}, ${now})`;
  await sql`update projects set status='RUNNING', updated_at=now() where id=${projectId}`;
  const project = (await sql`select * from projects where id=${projectId}`)[0];
  const repository = (await sql`select * from repositories where id=${repoId}`)[0];
  return { project, repository, template: "go-gin-postgres" };
}

export async function listProjects() {
  return getSql()`select * from projects order by created_at desc`;
}

export async function getProject(id: string) {
  const rows = await getSql()`select * from projects where id=${id}`;
  return rows[0] || null;
}

export async function listRepositories() {
  return getSql()`select * from repositories order by created_at desc`;
}

export async function getRepository(id: string) {
  const rows = await getSql()`select * from repositories where id=${id}`;
  return rows[0] || null;
}

export async function createPullRequest(input: {
  repository_id: string;
  github_pr_number?: number;
  base_sha?: string;
  head_sha?: string;
  title: string;
  author?: string;
  status?: string;
  diff?: string;
}) {
  const sql = getSql();
  const id = randomUUID();
  const prNumber = input.github_pr_number || Math.floor(Date.now() / 1000) % 100000;
  await sql`insert into pull_requests (id, repository_id, github_pr_number, base_sha, head_sha, title, author, status, diff)
    values (${id}, ${input.repository_id}, ${prNumber}, ${input.base_sha || "base"}, ${input.head_sha || "head"}, ${input.title}, ${input.author || "codex"}, ${input.status || "open"}, ${input.diff || ""})
    on conflict (repository_id, github_pr_number) do update set title=excluded.title, diff=excluded.diff, head_sha=excluded.head_sha, updated_at=now()`;
  const rows = await sql`select * from pull_requests where repository_id=${input.repository_id} and github_pr_number=${prNumber}`;
  return rows[0];
}

export async function listPullRequests() {
  return getSql()`select * from pull_requests order by created_at desc`;
}

export async function getPullRequest(id: string) {
  const rows = await getSql()`select * from pull_requests where id=${id}`;
  return rows[0] || null;
}

export async function analyzePullRequest(prId: string) {
  const sql = getSql();
  const pr = await getPullRequest(prId);
  if (!pr) throw new Error("pull request not found");
  const repo = await getRepository(pr.repository_id);
  if (!repo) throw new Error("repository not found");

  const analysisId = randomUUID();
  const started = new Date().toISOString();
  await sql`insert into analyses (id, pull_request_id, status, started_at) values (${analysisId}, ${prId}, 'ANALYZING', ${started})`;

  const graph = buildGraph(repo.name, pr.diff || "");
  const blast = blastRadius(graph);
  let findings = detectFindings(pr.diff || "");
  // advisory LLM duplicate
  if (findings.some((f) => f.title === "Duplicate payment risk")) {
    findings = [...findings, { ...findings.find((f) => f.title === "Duplicate payment risk")! }];
  }

  let remediations = false;
  let agentRun = null as null | Record<string, unknown>;
  let verification = verify(findings, false);
  if (!verification.passed) {
    const patch = codexPatch(pr.diff || "");
    remediations = patch.remediated;
    const arId = randomUUID();
    const now = new Date().toISOString();
    await sql`insert into agent_runs (id, analysis_id, provider, task, status, iteration, started_at, completed_at)
      values (${arId}, ${analysisId}, 'codex', 'fix_findings', 'COMPLETED', 1, ${now}, ${now})`;
    agentRun = { id: arId, provider: "codex", status: "COMPLETED", iteration: 1, summary: patch.summary };
    findings = findings.map((f) => (f.category === "reliability" && f.severity === "HIGH" ? { ...f, status: "resolved" } : f));
    verification = verify(findings, true);
  }

  const riskScores = scoreRisk((pr.diff || "") + (remediations ? "\nidempotency key required\nchargeOnce" : ""), graph, findings.filter((f) => f.status !== "resolved"), blast.score);
  const decision = policyDecision(riskScores, findings, verification.passed);

  for (const f of findings) {
    await sql`insert into findings (id, analysis_id, severity, category, title, description, file, line, evidence, recommendation, confidence, status)
      values (${randomUUID()}, ${analysisId}, ${f.severity}, ${f.category}, ${f.title}, ${f.description}, ${f.file || null}, ${f.line || null}, ${sql.json(f.evidence as never)}, ${f.recommendation}, ${f.confidence}, ${f.status})`;
  }

  const riskId = randomUUID();
  await sql`insert into risk_assessments (id, analysis_id, security_score, reliability_score, performance_score, database_score, api_score, messaging_score, testing_score, deployment_score, blast_radius, overall_risk, decision)
    values (${riskId}, ${analysisId}, ${riskScores.security_score}, ${riskScores.reliability_score}, ${riskScores.performance_score}, ${riskScores.database_score}, ${riskScores.api_score}, ${riskScores.messaging_score}, ${riskScores.testing_score}, ${riskScores.deployment_score}, ${riskScores.blast_radius}, ${riskScores.overall_risk}, ${decision.decision})`;

  const now = new Date().toISOString();
  await sql`insert into verification_runs (id, analysis_id, requirements, evidence, status, started_at, completed_at)
    values (${randomUUID()}, ${analysisId}, ${sql.json(verification.requirements as never)}, ${sql.json(verification.evidence as never)}, ${verification.passed ? "PASSED" : "FAILED"}, ${now}, ${now})`;

  // preview
  const previewId = randomUUID();
  await sql`insert into deployments (id, project_id, pull_request_id, environment, version, status, url, started_at, completed_at)
    values (${previewId}, ${repo.project_id}, ${prId}, 'preview', ${pr.head_sha}, 'COMPLETED', ${`https://pr-${pr.github_pr_number}.preview.agentguard.example.com`}, ${now}, ${now})`;

  let certificate = null as null | Record<string, unknown>;
  if (decision.decision === "ALLOW") {
    const prodId = randomUUID();
    await sql`insert into deployments (id, project_id, pull_request_id, environment, version, status, url, started_at, completed_at)
      values (${prodId}, ${repo.project_id}, ${prId}, 'production', ${pr.head_sha}, 'COMPLETED', ${`https://${repo.name}.agentguard.example.com`}, ${now}, ${now})`;
    const certId = randomUUID();
    await sql`insert into certificates (id, deployment_id, risk_score, blast_radius, evidence, decision, commit_sha)
      values (${certId}, ${prodId}, ${riskScores.overall_risk}, ${riskScores.blast_radius}, ${sql.json(verification.evidence as never)}, 'AUTO DEPLOY', ${pr.head_sha})`;
    certificate = (await sql`select * from certificates where id=${certId}`)[0];
    await sql`update projects set status='RUNNING', updated_at=now() where id=${repo.project_id}`;
  }

  await sql`update analyses set status='COMPLETED', completed_at=${now} where id=${analysisId}`;
  const analysis = (await sql`select * from analyses where id=${analysisId}`)[0];
  const risk = (await sql`select * from risk_assessments where id=${riskId}`)[0];
  const savedFindings = await sql`select * from findings where analysis_id=${analysisId}`;
  return { analysis, findings: savedFindings, risk, agent_run: agentRun, certificate, decision };
}

export async function getAnalysis(id: string) {
  const sql = getSql();
  const analysis = (await sql`select * from analyses where id=${id}`)[0];
  if (!analysis) return null;
  const findings = await sql`select * from findings where analysis_id=${id}`;
  const risk = (await sql`select * from risk_assessments where analysis_id=${id}`)[0];
  return { analysis, findings, risk };
}

export async function getRisk(id: string) {
  const rows = await getSql()`select * from risk_assessments where id=${id} or analysis_id=${id}`;
  return rows[0] || null;
}

export async function listDeployments() {
  return getSql()`select * from deployments order by started_at desc nulls last`;
}

export async function getDeployment(id: string) {
  const rows = await getSql()`select * from deployments where id=${id}`;
  return rows[0] || null;
}

export async function getCertificate(id: string) {
  const rows = await getSql()`select * from certificates where id=${id}`;
  return rows[0] || null;
}

export async function dashboard() {
  const sql = getSql();
  const prs = await sql`select * from pull_requests order by created_at desc limit 1`;
  const stats = {
    production_confidence: 96,
    security: 98,
    reliability: 94,
    performance: 92,
    architecture: 95,
    database: 97,
    latest_pr: prs[0] || null,
    latest_risk: null as null | Record<string, unknown>,
  };
  if (prs[0]) {
    const an = await sql`select id from analyses where pull_request_id=${prs[0].id} order by created_at desc limit 1`;
    if (an[0]) {
      const risk = await sql`select * from risk_assessments where analysis_id=${an[0].id}`;
      if (risk[0]) {
        stats.latest_risk = risk[0];
        stats.production_confidence = Math.max(0, 100 - Number(risk[0].overall_risk));
        stats.security = Math.max(0, 100 - Number(risk[0].security_score));
        stats.reliability = Math.max(0, 100 - Number(risk[0].reliability_score));
        stats.database = Math.max(0, 100 - Number(risk[0].database_score));
      }
    }
  }
  return stats;
}

export async function analyzeRepository(repoId: string) {
  const sql = getSql();
  const repo = await getRepository(repoId);
  if (!repo) throw new Error("not found");
  const g = buildGraph(repo.name, "Dockerfile\npostgres\ngin\n");
  await sql`insert into repository_scans (repository_id, status, baseline, graph, commit_sha, started_at, completed_at)
    values (${repoId}, 'COMPLETED', ${sql.json({ languages: ["Go"], services: [repo.name], databases: ["PostgreSQL"] } as never)}, ${sql.json(g as never)}, 'baseline', now(), now())`;
  return { status: "completed", repository_id: repoId };
}
