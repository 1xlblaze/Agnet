import { fail, ok } from "@/lib/api-response";
import { loadDashboard } from "@/lib/agentguard/dashboard";

export async function GET() {
  try {
    return ok(await loadDashboard());
  } catch (e) {
    return fail("dashboard_failed", e instanceof Error ? e.message : "error", 500);
  }
}
