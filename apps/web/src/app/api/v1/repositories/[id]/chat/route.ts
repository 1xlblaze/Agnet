import { fail, ok } from "@/lib/api-response";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    if (!body?.message) return fail("invalid_body", "message required", 400);
    if (useEdgeApi()) {
      return proxyEdge(`repositories/${id}/chat`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
    }
    return fail("not_configured", "Chat requires Supabase edge API", 503);
  } catch (e) {
    return fail("chat_failed", e instanceof Error ? e.message : "error", 500);
  }
}
