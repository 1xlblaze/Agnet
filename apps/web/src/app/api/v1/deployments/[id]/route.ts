import { fail, ok } from "@/lib/api-response";
import { getDeployment } from "@/lib/agentguard/db";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = await getDeployment(id);
  if (!d) return fail("not_found", "not found", 404);
  return ok(d);
}
