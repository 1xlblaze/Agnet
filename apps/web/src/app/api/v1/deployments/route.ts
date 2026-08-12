import { fail, ok } from "@/lib/api-response";
import { listDeployments } from "@/lib/agentguard/db";
export async function GET() {
  try { return ok({ items: await listDeployments() }); }
  catch (e) { return fail("list_failed", e instanceof Error ? e.message : "error", 500); }
}
