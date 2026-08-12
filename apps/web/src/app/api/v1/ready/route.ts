import { fail, ok } from "@/lib/api-response";
import { hasDatabase, getSql } from "@/lib/supabase";
export async function GET() {
  try {
    if (!hasDatabase()) return fail("not_ready", "database not configured", 503);
    await getSql()`select 1`;
    return ok({ status: "ready" });
  } catch (e) {
    return fail("not_ready", e instanceof Error ? e.message : "db error", 503);
  }
}
