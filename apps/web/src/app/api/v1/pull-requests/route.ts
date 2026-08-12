import { fail, ok } from "@/lib/api-response";
import { createPullRequest, listPullRequests } from "@/lib/agentguard/db";
export async function GET() {
  try { return ok({ items: await listPullRequests() }); }
  catch (e) { return fail("list_failed", e instanceof Error ? e.message : "error", 500); }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.repository_id || !body?.title) return fail("invalid_body", "repository_id and title required");
    return ok(await createPullRequest(body), 201);
  } catch (e) { return fail("create_failed", e instanceof Error ? e.message : "error", 500); }
}
