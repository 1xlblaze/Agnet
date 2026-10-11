import { randomUUID } from "crypto";
import { buildBaselineDocument, buildGraphFromPaths, fetchGitHubRepo } from "@/lib/agentguard/baseline/baseline";
import { extractAstFromPaths } from "@/lib/agentguard/baseline/ast-extract";
import { getSql } from "@/lib/supabase";

async function upsertReport(
  repoId: string,
  projectId: string,
  kind: "baseline" | "summary",
  document: Record<string, unknown>,
) {
  const sql = getSql();
  const key = `repo:${repoId}:${kind}`;
  const existing = await sql`
    select id, version from agentguard_reports where key = ${key} limit 1
  `.catch(() => []);
  const version = (existing[0]?.version as number | undefined ?? 0) + 1;
  const updatedAt = new Date().toISOString();
  if (existing[0]?.id) {
    await sql`
      update agentguard_reports
      set document = ${sql.json(document as never)}, version = ${version}, updated_at = ${updatedAt}
      where id = ${existing[0].id}
    `;
  } else {
    await sql`
      insert into agentguard_reports (id, key, repository_id, project_id, pull_request_id, kind, document, version, updated_at)
      values (${randomUUID()}, ${key}, ${repoId}, ${projectId}, null, ${kind}, ${sql.json(document as never)}, ${version}, ${updatedAt})
    `;
  }
  return version;
}

export async function analyzeRepository(repoId: string) {
  const sql = getSql();
  const rows = await sql`select * from repositories where id = ${repoId} limit 1`;
  const repo = rows[0];
  if (!repo) throw new Error("repository not found");

  await sql`update repositories set status = 'ANALYZING', updated_at = now() where id = ${repoId}`;

  const { languages, paths } = await fetchGitHubRepo(repo.owner as string, repo.name as string);
  const baseGraph = buildGraphFromPaths(repo.name as string, paths);
  const { ast, graph } = await extractAstFromPaths(
    repo.owner as string,
    repo.name as string,
    paths,
    repo.name as string,
    baseGraph,
  );
  const { baselineDoc, summaryDoc } = buildBaselineDocument({
    repositoryId: repoId,
    owner: repo.owner as string,
    name: repo.name as string,
    paths,
    languages,
    graph,
    ast,
  });

  const baselineVersion = await upsertReport(repoId, repo.project_id as string, "baseline", baselineDoc);
  const summaryVersion = await upsertReport(repoId, repo.project_id as string, "summary", summaryDoc);

  await sql`update repositories set status = 'READY', updated_at = now() where id = ${repoId}`;

  return {
    status: "completed",
    repository_id: repoId,
    production_confidence: summaryDoc.production_confidence,
    baseline_version: baselineVersion,
    summary_version: summaryVersion,
    scanned_at: baselineDoc.scanned_at,
  };
}
