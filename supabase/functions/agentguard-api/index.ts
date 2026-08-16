import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    const parts = path.split("/");
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
