import { fail, ok } from "@/lib/api-response";
import { listDeployments } from "@/lib/agentguard/db";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function GET() {
  try {
    if (useEdgeApi()) return proxyEdge("deployments");
    return ok({ items: await listDeployments() });
  } catch (e) {
    return fail("list_failed", e instanceof Error ? e.message : "error", 500);
  }
}
