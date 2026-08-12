import { fail, ok } from "@/lib/api-response";
import { getPullRequest } from "@/lib/agentguard/db";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pr = await getPullRequest(id);
  if (!pr) return fail("not_found", "not found", 404);
  return ok(pr);
}
