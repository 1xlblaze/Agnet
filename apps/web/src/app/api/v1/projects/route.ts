import { fail, ok } from "@/lib/api-response";
import { ensureOrg } from "@/lib/agentguard/db";
import { connectGitHubProject } from "@/lib/agentguard/github-connect";
import { listProjectsEnriched } from "@/lib/agentguard/projects-list";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";
import { getSql } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function GET() {
  try {
    if (useEdgeApi()) return proxyEdge("projects");
    return ok({ items: await listProjectsEnriched() });
  } catch (e) {
    return fail("list_failed", e instanceof Error ? e.message : "error", 500);
  }
}

export async function POST(req: Request) {
  try {
    if (useEdgeApi()) return proxyEdge("projects", { method: "POST", body: await req.text(), headers: { "Content-Type": "application/json" } });
    const body = await req.json();
    if (body?.github || body?.full_name || body?.repository) {
      const result = await connectGitHubProject(body);
      return ok(result, result.existing ? 200 : 201);
    }
    if (!body?.name) return fail("invalid_body", "name or github (owner/repo) required");
    const org = body.organization_id || await ensureOrg();
    const id = randomUUID();
    await getSql()`insert into projects (id, organization_id, name, description, status) values (${id}, ${org}, ${body.name}, ${body.description || ""}, 'READY')`;
    const rows = await getSql()`select * from projects where id=${id}`;
    return ok(rows[0], 201);
  } catch (e) {
    return fail("create_failed", e instanceof Error ? e.message : "error", 500);
  }
}
