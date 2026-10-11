import { answerRepoQuestion, extractGaps } from "@/lib/agentguard/baseline/repo-rag";
import { getSql } from "@/lib/supabase";

export async function getRepoReport(repoId: string) {
  const sql = getSql();
  const repoRows = await sql`select * from repositories where id = ${repoId} limit 1`;
  const repo = repoRows[0];
  if (!repo) throw new Error("repository not found");

  const reports = await sql`
    select kind, document, version, updated_at from agentguard_reports
    where repository_id = ${repoId} and kind in ('summary', 'baseline')
  `.catch(() => []);

  const byKind: Record<string, unknown> = {};
  for (const r of reports) {
    byKind[r.kind as string] = r.document;
    byKind[`${r.kind}_version`] = r.version;
    byKind[`${r.kind}_updated_at`] = r.updated_at;
  }

  const summary = (byKind.summary as Record<string, unknown>) || null;
  const gaps = summary ? extractGaps(summary) : [];

  return {
    repository: repo,
    summary,
    baseline: byKind.baseline || null,
    gaps,
    gap_count: gaps.length,
    production_confidence: summary?.production_confidence ?? 0,
    has_report: Boolean(summary),
  };
}

export async function chatAboutRepo(repoId: string, message: string) {
  const reportData = await getRepoReport(repoId);
  if (!reportData.summary) {
    throw new Error("No baseline report found. Run a baseline scan first.");
  }
  const result = answerRepoQuestion(reportData.summary as Record<string, unknown>, message);
  return {
    repository_id: repoId,
    question: message,
    answer: result.answer,
    intent: result.intent,
    gaps: result.gaps,
    sources: result.sources,
    production_confidence: reportData.production_confidence,
  };
}
