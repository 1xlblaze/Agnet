import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildBaselineDocument, fetchGitHubRepo } from "./baseline.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function fail(code: string, message: string, status = 500) {
  return json({ error: { code, message } }, status);
}

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function routePath(req: Request) {
  const url = new URL(req.url);
  const prefix = "/agentguard-api";
  let path = url.pathname;
  if (path.startsWith(prefix)) path = path.slice(prefix.length);
  path = path.replace(/^\/+/, "");
  if (path.startsWith("api/v1/")) path = path.slice("api/v1/".length);
  return path;
}

function parseGitHubRef(input: Record<string, unknown>) {
  const raw = (input.github as string) || (input.full_name as string) || (input.repository as string) || "";
  if (raw.includes("/")) {
    const [owner, ...rest] = raw.replace(/^https?:\/\/github\.com\//, "").split("/");
    const name = rest.join("/").replace(/\.git$/, "");
    if (owner && name) return { owner, name };
  }
  const owner = input.owner as string;
  const name = (input.name as string) || (input.repo as string);
  if (owner && name) return { owner, name };
  return null;
}

async function ensureOrg(sb: SupabaseClient) {
  const { data } = await sb.from("organizations").select("id").order("created_at", { ascending: true }).limit(1);
  if (data?.[0]) return data[0].id as string;
  const id = crypto.randomUUID();
  const { error } = await sb.from("organizations").insert({ id, name: "AgentGuard" });
  if (error) throw error;
  return id;
}

async function upsertReport(
  sb: SupabaseClient,
  repoId: string,
  projectId: string,
  kind: "baseline" | "summary",
  document: Record<string, unknown>,
) {
  const key = `repo:${repoId}:${kind}`;
  const { data: existing } = await sb
    .from("agentguard_reports")
    .select("id, version")
    .eq("key", key)
    .maybeSingle();

  const version = (existing?.version ?? 0) + 1;
  const row = {
    key,
    repository_id: repoId,
    project_id: projectId,
    pull_request_id: null,
    kind,
    document,
    version,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from("agentguard_reports").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("agentguard_reports").insert({ id: crypto.randomUUID(), ...row });
    if (error) throw error;
  }
  return version;
}

async function buildRepoCards() {
  const sb = admin();
  const { data: repos, error: repoErr } = await sb
    .from("repositories")
    .select("id, owner, name, project_id, status, created_at, updated_at, projects(id, name, description)")
    .order("updated_at", { ascending: false });
  if (repoErr) throw repoErr;

  const { data: reports, error: repErr } = await sb
    .from("agentguard_reports")
    .select("repository_id, kind, document, version, updated_at")
    .in("kind", ["summary", "baseline", "pr"]);
  if (repErr) throw repErr;

  const byRepo = new Map<string, Record<string, unknown>>();
  for (const r of reports || []) {
    const bucket = byRepo.get(r.repository_id) || {};
    bucket[r.kind] = r.document;
    bucket[`${r.kind}_version`] = r.version;
    byRepo.set(r.repository_id, bucket);
  }

  return (repos || []).map((repo) => {
    const reportsForRepo = byRepo.get(repo.id) || {};
    const summary = (reportsForRepo.summary as Record<string, unknown> | undefined) || null;
    const scores = (summary?.scores as Record<string, unknown> | undefined) || {};
    const fullName = `${repo.owner}/${repo.name}`;
    const project = repo.projects as { id?: string; name?: string; description?: string } | null;
    const report = summary
      ? {
          kind: "summary",
          document: summary,
          production_confidence: Number(summary.production_confidence ?? scores.production_confidence ?? 0),
          scores,
          baseline: reportsForRepo.baseline ?? null,
          pr: reportsForRepo.pr ?? null,
        }
      : null;

    return {
      id: repo.id,
      repository_id: repo.id,
      project_id: repo.project_id,
      owner: repo.owner,
      name: repo.name,
      full_name: (summary?.full_name as string | undefined) ?? fullName,
      github_url: (summary?.github_url as string | undefined) ?? `https://github.com/${fullName}`,
      project_name: project?.name ?? repo.name,
      project_description: project?.description ?? "",
      status: repo.status,
      production_confidence: report?.production_confidence ?? 0,
      scores,
      summary,
      baseline: (reportsForRepo.baseline as Record<string, unknown> | undefined) ?? null,
      pr: (reportsForRepo.pr as Record<string, unknown> | undefined) ?? null,
      latest_pr: summary?.latest_pr ?? null,
      report,
      reports: reportsForRepo,
      has_report: Boolean(summary),
    };
  });
}

async function dashboard() {
  const cards = await buildRepoCards();
  const withReports = cards.filter((c) => c.report);
  return {
    items: withReports,
    repositories: cards,
    repos: cards,
    report_cards: withReports,
    connected_repositories: cards,
    repositories_with_reports: withReports,
  };
}

async function listProjects() {
  const sb = admin();
  const { data: projects, error: projErr } = await sb
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (projErr) throw projErr;

  const { data: repos, error: repoErr } = await sb
    .from("repositories")
    .select("*")
    .order("created_at", { ascending: false });
  if (repoErr) throw repoErr;

  const cards = await buildRepoCards();
  const byProject = new Map(cards.map((c) => [c.project_id, c]));

  const items = (projects || []).map((p) => ({
    ...p,
    repository: (repos || []).find((r) => r.project_id === p.id) ?? null,
    report: byProject.get(p.id)?.report ?? null,
  }));

  return { items };
}

async function listReports() {
  const sb = admin();
  const { data, error } = await sb
    .from("agentguard_reports")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return { items: data || [] };
}

async function listTable(table: string, orderColumn = "created_at") {
  const sb = admin();
  const { data, error } = await sb.from(table).select("*").order(orderColumn, { ascending: false });
  if (error) throw error;
  return { items: data || [] };
}

async function getById(table: string, id: string) {
  const sb = admin();
  const { data, error } = await sb.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return fail("not_found", `${table} not found`, 404);
  return data;
}

async function ready() {
  const sb = admin();
  const { error } = await sb.from("organizations").select("id").limit(1);
  if (error) throw error;
  return { status: "ready" };
}

async function createProject(body: Record<string, unknown>) {
  const sb = admin();
  const gh = parseGitHubRef(body);

  if (gh) {
    const orgId = (body.organization_id as string) || (await ensureOrg(sb));
    const projectId = crypto.randomUUID();
    const repoId = crypto.randomUUID();

    const ghData = await fetchGitHubRepo(gh.owner, gh.name);
    const { error: projErr } = await sb.from("projects").insert({
      id: projectId,
      organization_id: orgId,
      name: gh.name,
      description: (body.description as string) || `Connected GitHub repository ${gh.owner}/${gh.name}`,
      status: "READY",
    });
    if (projErr) throw projErr;

    const { error: repoErr } = await sb.from("repositories").insert({
      id: repoId,
      project_id: projectId,
      github_repository_id: ghData.repo.id,
      owner: gh.owner,
      name: gh.name,
      default_branch: ghData.repo.default_branch || "main",
      installation_id: 0,
      status: "READY",
    });
    if (repoErr) throw repoErr;

    const project = (await sb.from("projects").select("*").eq("id", projectId).single()).data;
    const repository = (await sb.from("repositories").select("*").eq("id", repoId).single()).data;
    return { project, repository, connected: true };
  }

  if (!body.name) throw new Error("name or github (owner/repo) required");
  const orgId = (body.organization_id as string) || (await ensureOrg(sb));
  const projectId = crypto.randomUUID();
  const { error } = await sb.from("projects").insert({
    id: projectId,
    organization_id: orgId,
    name: body.name,
    description: (body.description as string) || "",
    status: "READY",
  });
  if (error) throw error;
  const project = (await sb.from("projects").select("*").eq("id", projectId).single()).data;
  return project;
}

async function generateProject(body: Record<string, unknown>) {
  const sb = admin();
  if (!body.name) throw new Error("name required");
  const name = body.name as string;
  const orgId = await ensureOrg(sb);
  const projectId = crypto.randomUUID();
  const repoId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sb.from("projects").insert({
    id: projectId,
    organization_id: orgId,
    name,
    description: "Auto-generated Go/Gin/PostgreSQL project",
    status: "READY",
  });
  await sb.from("repositories").insert({
    id: repoId,
    project_id: projectId,
    github_repository_id: Date.now(),
    owner: "agentguard-demo",
    name,
    default_branch: "main",
    installation_id: 1,
    status: "READY",
  });
  const depId = crypto.randomUUID();
  await sb.from("deployments").insert({
    id: depId,
    project_id: projectId,
    environment: "production",
    version: "v0.1.0",
    status: "COMPLETED",
    url: `https://${name.toLowerCase()}.agentguard.example.com`,
    started_at: now,
    completed_at: now,
  });
  await sb.from("projects").update({ status: "RUNNING", updated_at: now }).eq("id", projectId);

  const project = (await sb.from("projects").select("*").eq("id", projectId).single()).data;
  const repository = (await sb.from("repositories").select("*").eq("id", repoId).single()).data;
  return { project, repository, template: "go-gin-postgres" };
}

async function createRepository(body: Record<string, unknown>) {
  const sb = admin();
  const gh = parseGitHubRef(body);
  const projectId = body.project_id as string;
  if (!projectId) throw new Error("project_id required");

  let owner = body.owner as string;
  let name = body.name as string;
  let githubId = Number(body.github_repository_id || 0);
  let defaultBranch = (body.default_branch as string) || "main";

  if (gh) {
    owner = gh.owner;
    name = gh.name;
    const ghData = await fetchGitHubRepo(owner, name);
    githubId = ghData.repo.id;
    defaultBranch = ghData.repo.default_branch || defaultBranch;
  }

  if (!owner || !name) throw new Error("owner and name (or github owner/repo) required");

  const repoId = crypto.randomUUID();
  const { error } = await sb.from("repositories").insert({
    id: repoId,
    project_id: projectId,
    github_repository_id: githubId,
    owner,
    name,
    default_branch: defaultBranch,
    installation_id: Number(body.installation_id || 0),
    status: "READY",
  });
  if (error) throw error;
  const repository = (await sb.from("repositories").select("*").eq("id", repoId).single()).data;
  return repository;
}

async function analyzeRepository(repoId: string) {
  const sb = admin();
  const { data: repo, error } = await sb.from("repositories").select("*").eq("id", repoId).maybeSingle();
  if (error) throw error;
  if (!repo) throw new Error("repository not found");

  await sb.from("repositories").update({ status: "ANALYZING", updated_at: new Date().toISOString() }).eq("id", repoId);

  const { languages, paths } = await fetchGitHubRepo(repo.owner, repo.name);
  const { baselineDoc, summaryDoc } = buildBaselineDocument({
    repositoryId: repoId,
    owner: repo.owner,
    name: repo.name,
    paths,
    languages,
  });

  const baselineVersion = await upsertReport(sb, repoId, repo.project_id, "baseline", baselineDoc);
  const summaryVersion = await upsertReport(sb, repoId, repo.project_id, "summary", summaryDoc);

  await sb.from("repositories").update({ status: "READY", updated_at: new Date().toISOString() }).eq("id", repoId);

  return {
    status: "completed",
    repository_id: repoId,
    production_confidence: summaryDoc.production_confidence,
    baseline_version: baselineVersion,
    summary_version: summaryVersion,
    scanned_at: baselineDoc.scanned_at,
  };
}

async function analyzePullRequest(prId: string) {
  const sb = admin();
  const { data: pr, error: prErr } = await sb.from("pull_requests").select("*").eq("id", prId).maybeSingle();
  if (prErr) throw prErr;
  if (!pr) throw new Error("pull request not found");

  const { data: repo, error: repoErr } = await sb.from("repositories").select("*").eq("id", pr.repository_id).maybeSingle();
  if (repoErr) throw repoErr;
  if (!repo) throw new Error("repository not found");

  const analysisId = crypto.randomUUID();
  const now = new Date().toISOString();
  await sb.from("analyses").insert({
    id: analysisId,
    pull_request_id: prId,
    status: "COMPLETED",
    started_at: now,
    completed_at: now,
  });

  const diff = (pr.diff as string) || "";
  const hasRisk = /retry|password|secret/i.test(diff);
  const riskScore = hasRisk ? 35 : 12;
  const riskId = crypto.randomUUID();
  await sb.from("risk_assessments").insert({
    id: riskId,
    analysis_id: analysisId,
    security_score: hasRisk ? 40 : 10,
    reliability_score: hasRisk ? 45 : 15,
    performance_score: 20,
    database_score: 10,
    api_score: 10,
    messaging_score: 5,
    testing_score: 45,
    deployment_score: 15,
    blast_radius: 15,
    overall_risk: riskScore,
    decision: hasRisk ? "REVIEW" : "ALLOW",
  });

  return {
    analysis: { id: analysisId, pull_request_id: prId, status: "COMPLETED" },
    risk: { overall_risk: riskScore, decision: hasRisk ? "REVIEW" : "ALLOW" },
    status: "completed",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const path = routePath(req);
    const method = req.method.toUpperCase();

    if (path === "health" && method === "GET") return json({ status: "ok" });
    if (path === "ready" && method === "GET") return json(await ready());
    if (path === "dashboard" && method === "GET") return json(await dashboard());
    if (path === "projects" && method === "GET") return json(await listProjects());
    if (path === "reports" && method === "GET") return json(await listReports());
    if (path === "repositories" && method === "GET") return json(await listTable("repositories"));
    if (path === "pull-requests" && method === "GET") return json(await listTable("pull_requests"));
    if (path === "deployments" && method === "GET") return json(await listTable("deployments", "started_at"));

    if (path === "projects" && method === "POST") {
      const body = await req.json();
      const result = await createProject(body);
      return json(result, 201);
    }

    if (path === "projects/generate" && method === "POST") {
      const body = await req.json();
      const result = await generateProject(body);
      return json(result, 201);
    }

    if (path === "repositories" && method === "POST") {
      const body = await req.json();
      const result = await createRepository(body);
      return json(result, 201);
    }

    const parts = path.split("/");

    if (parts.length === 3 && parts[0] === "repositories" && parts[2] === "analyze" && method === "POST") {
      return json(await analyzeRepository(parts[1]), 202);
    }

    if (parts.length === 3 && parts[0] === "pull-requests" && parts[2] === "analyze" && method === "POST") {
      return json(await analyzePullRequest(parts[1]), 202);
    }

    if (parts.length === 2 && method === "GET") {
      const [resource, id] = parts;
      const tableMap: Record<string, string> = {
        projects: "projects",
        repositories: "repositories",
        "pull-requests": "pull_requests",
        deployments: "deployments",
        analyses: "analyses",
        certificates: "certificates",
        "risk-assessments": "risk_assessments",
      };
      const table = tableMap[resource];
      if (table) return json(await getById(table, id));
    }

    return fail("not_found", `Unknown route: ${method} ${path}`, 404);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail("internal_error", message, 500);
  }
});
