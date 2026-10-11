import { randomUUID } from "crypto";
import { fetchGitHubRepo } from "@/lib/agentguard/baseline/baseline";
import { ensureOrg } from "@/lib/agentguard/db";
import { getSql } from "@/lib/supabase";

function parseGitHubRef(input: Record<string, unknown>) {
  const raw =
    (input.github as string) || (input.full_name as string) || (input.repository as string) || "";
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

async function findConnectedRepo(owner: string, name: string, githubId?: number) {
  const sql = getSql();
  if (githubId) {
    const byId = await sql`select * from repositories where github_repository_id = ${githubId} limit 1`;
    if (byId[0]) return byId[0];
  }
  const byName = await sql`
    select * from repositories where owner = ${owner} and name = ${name}
    order by created_at desc limit 1
  `;
  return byName[0] || null;
}

export async function connectGitHubProject(body: Record<string, unknown>) {
  const gh = parseGitHubRef(body);
  if (!gh) throw new Error("name or github (owner/repo) required");

  const ghData = await fetchGitHubRepo(gh.owner, gh.name);
  const existing = await findConnectedRepo(gh.owner, gh.name, ghData.repo.id as number);
  const sql = getSql();

  if (existing) {
    const projectRows = await sql`select * from projects where id = ${existing.project_id} limit 1`;
    const project = projectRows[0];
    if (!project) throw new Error("project not found for existing repository");
    return { project, repository: existing, connected: true, existing: true };
  }

  const orgId = (body.organization_id as string) || (await ensureOrg());
  const projectId = randomUUID();
  const repoId = randomUUID();

  await sql`
    insert into projects (id, organization_id, name, description, status)
    values (
      ${projectId},
      ${orgId},
      ${gh.name},
      ${(body.description as string) || `Connected GitHub repository ${gh.owner}/${gh.name}`},
      'READY'
    )
  `;
  await sql`
    insert into repositories (id, project_id, github_repository_id, owner, name, default_branch, installation_id, status)
    values (
      ${repoId},
      ${projectId},
      ${ghData.repo.id as number},
      ${gh.owner},
      ${gh.name},
      ${(ghData.repo.default_branch as string) || "main"},
      0,
      'READY'
    )
  `;

  const project = (await sql`select * from projects where id = ${projectId}`)[0];
  const repository = (await sql`select * from repositories where id = ${repoId}`)[0];
  return { project, repository, connected: true, existing: false };
}
