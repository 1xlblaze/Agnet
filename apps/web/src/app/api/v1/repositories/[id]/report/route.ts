import { fail, ok } from "@/lib/api-response";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (useEdgeApi()) return proxyEdge(`repositories/${id}/report`);
    return fail("not_configured", "Report requires Supabase edge API", 503);
  } catch (e) {
    return fail("report_failed", e instanceof Error ? e.message : "error", 500);
  }
}
