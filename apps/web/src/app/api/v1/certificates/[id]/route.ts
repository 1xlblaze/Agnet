import { fail, ok } from "@/lib/api-response";
import { getCertificate } from "@/lib/agentguard/db";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = await getCertificate(id);
  if (!c) return fail("not_found", "not found", 404);
  return ok(c);
}
