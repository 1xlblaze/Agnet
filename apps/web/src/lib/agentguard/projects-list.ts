import { extractGaps } from "@/lib/agentguard/baseline/repo-rag";
import { getSql } from "@/lib/supabase";

export async function listProjectsEnriched() {
  const sql = getSql();
  const projects = await sql`select * from projects order by created_at desc`;
  const repos = await sql`select * from repositories`;
  const reports = await sql`
    select repository_id, kind, document from agentguard_reports
    where kind in ('summary', 'baseline')
  `.catch(() => []);

  const repoByProject = new Map<string, (typeof repos)[0]>();
  for (const r of repos) repoByProject.set(r.project_id as string, r);

  const summaryByRepo = new Map<string, Record<string, unknown>>();
  for (const row of reports) {
    if (row.kind === "summary") summaryByRepo.set(row.repository_id as string, row.document as Record<string, unknown>);
  }

  return projects.map((p) => {
    const repository = repoByProject.get(p.id as string) ?? null;
    const summary = repository ? summaryByRepo.get(repository.id as string) ?? null : null;
    const report = summary
      ? {
          production_confidence: Number(summary.production_confidence ?? 0),
          gaps: extractGaps(summary),
          scores: summary.scores,
        }
      : null;
    return {
      ...p,
      repository,
      report,
    };
  });
}
