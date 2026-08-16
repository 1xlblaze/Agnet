import { getSupabaseAdmin } from "@/lib/supabase";

type RepoRow = {
  id: string;
  owner: string;
  name: string;
  project_id: string;
  status: string;
  projects?: { id: string; name: string; description: string } | { id: string; name: string; description: string }[] | null;
};

export async function dashboardReports() {
  const sb = getSupabaseAdmin();
  const { data: repos, error: repoErr } = await sb
    .from("repositories")
    .select("id, owner, name, project_id, status, projects(id, name, description)")
    .order("updated_at", { ascending: false });
  if (repoErr) throw repoErr;

  const { data: reports, error: repErr } = await sb
    .from("agentguard_reports")
    .select("repository_id, kind, document, version")
    .in("kind", ["summary", "baseline", "pr"]);
  if (repErr) throw repErr;

  const byRepo = new Map<string, Record<string, unknown>>();
  for (const row of reports || []) {
    const bucket = byRepo.get(row.repository_id) || {};
    bucket[row.kind] = row.document;
    byRepo.set(row.repository_id, bucket);
  }

  const cards = (repos as RepoRow[] | null || []).map((repo) => {
    const reportsForRepo = byRepo.get(repo.id) || {};
    const summary = (reportsForRepo.summary as Record<string, unknown> | undefined) || null;
    const scores = (summary?.scores as Record<string, unknown> | undefined) || {};
    const fullName = `${repo.owner}/${repo.name}`;
    const project = Array.isArray(repo.projects) ? repo.projects[0] : repo.projects;
    const report = summary
      ? {
          kind: "summary" as const,
          document: summary,
          production_confidence: Number(summary.production_confidence ?? scores.production_confidence ?? 0),
          scores,
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
      status: repo.status,
      production_confidence: report?.production_confidence ?? 0,
      scores,
      report,
    };
  });

  const withReports = cards.filter((c) => c.report);
  return {
    items: withReports,
    repositories_with_reports: withReports,
    repositories: cards,
  };
}
