import { fail, ok } from "@/lib/api-response";
import { generateProject } from "@/lib/agentguard/db";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return fail("invalid_body", "name required");
    return ok(await generateProject(body.name), 201);
  } catch (e) { return fail("generate_failed", e instanceof Error ? e.message : "error", 500); }
}
