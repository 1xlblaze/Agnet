import { fail, ok } from "@/lib/api-response";
import { dashboardReports } from "@/lib/agentguard/reports";
import { dashboard } from "@/lib/agentguard/db";
import { hasDatabase, hasSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    if (hasSupabaseAdmin()) return ok(await dashboardReports());
    if (hasDatabase()) return ok(await dashboard());
    return fail("config_error", "Supabase or database configuration is required", 500);
  } catch (e) {
    return fail("dashboard_failed", e instanceof Error ? e.message : "error", 500);
  }
}
