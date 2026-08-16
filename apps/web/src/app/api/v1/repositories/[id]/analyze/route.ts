import { fail, ok } from "@/lib/api-response";
import { analyzeRepository } from "@/lib/agentguard/db";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export const maxDuration = 60;

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (useEdgeApi()) return proxyEdge(`repositories/${id}/analyze`, { method: "POST" });
    return ok(await analyzeRepository(id), 202);
  } catch (e) {
    return fail("analyze_failed", e instanceof Error ? e.message : "error", 500);
  }
}
