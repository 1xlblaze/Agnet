import { fail, ok } from "@/lib/api-response";
import { dashboard } from "@/lib/agentguard/db";
export async function GET() {
  try { return ok(await dashboard()); }
  catch (e) { return fail("dashboard_failed", e instanceof Error ? e.message : "error", 500); }
}
