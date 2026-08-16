import { fail, ok } from "@/lib/api-response";
import { analyzePullRequest } from "@/lib/agentguard/db";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (useEdgeApi()) return proxyEdge(`pull-requests/${id}/analyze`, { method: "POST" });
    const result = await analyzePullRequest(id);
    return ok(result, 202);
  } catch (e) {
    return fail("analyze_failed", e instanceof Error ? e.message : "error", 500);
  }
}
