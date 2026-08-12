import { fail, ok } from "@/lib/api-response";
import { listRepositories } from "@/lib/agentguard/db";
import { getSql } from "@/lib/supabase";
import { randomUUID } from "crypto";
export async function GET() {
  try { return ok({ items: await listRepositories() }); }
  catch (e) { return fail("list_failed", e instanceof Error ? e.message : "error", 500); }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.project_id || !body?.owner || !body?.name) return fail("invalid_body", "project_id, owner, name required");
    const id = randomUUID();
    await getSql()`insert into repositories (id, project_id, github_repository_id, owner, name, default_branch, installation_id, status)
      values (${id}, ${body.project_id}, ${body.github_repository_id || 0}, ${body.owner}, ${body.name}, ${body.default_branch || "main"}, ${body.installation_id || 0}, 'READY')`;
    const rows = await getSql()`select * from repositories where id=${id}`;
    return ok(rows[0], 201);
  } catch (e) { return fail("create_failed", e instanceof Error ? e.message : "error", 500); }
}
