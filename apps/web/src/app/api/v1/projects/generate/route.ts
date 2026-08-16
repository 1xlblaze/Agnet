import { fail, ok } from "@/lib/api-response";
import { generateProject } from "@/lib/agentguard/db";
import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";

export async function POST(req: Request) {
  try {
    if (useEdgeApi()) {
      return proxyEdge("projects/generate", {
        method: "POST",
        body: await req.text(),
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    if (!body?.name) return fail("invalid_body", "name required");
    return ok(await generateProject(body.name), 201);
  } catch (e) {
    return fail("generate_failed", e instanceof Error ? e.message : "error", 500);
  }
}
