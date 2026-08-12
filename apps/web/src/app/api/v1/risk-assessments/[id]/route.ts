import { fail, ok } from "@/lib/api-response";
import { getRisk } from "@/lib/agentguard/db";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await getRisk(id);
  if (!r) return fail("not_found", "not found", 404);
  return ok(r);
}
