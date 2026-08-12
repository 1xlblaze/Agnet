import { fail, ok } from "@/lib/api-response";
import { getAnalysis } from "@/lib/agentguard/db";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = await getAnalysis(id);
  if (!data) return fail("not_found", "not found", 404);
  return ok(data);
}
