import { fail, ok } from "@/lib/api-response";
import { getProject } from "@/lib/agentguard/db";
import { getSql } from "@/lib/supabase";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = await getProject(id);
  if (!p) return fail("not_found", "project not found", 404);
  return ok(p);
}
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await getSql()`delete from projects where id=${id}`;
  return new Response(null, { status: 204 });
}
