import { fail, ok } from "@/lib/api-response";
import { getRepoReport } from "@/lib/agentguard/repo-reports";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (useEdgeApi()) return proxyEdge(`repositories/${id}/report`);
    return ok(await getRepoReport(id));
  } catch (e) {
    return fail("report_failed", e instanceof Error ? e.message : "error", 500);
  }
}
