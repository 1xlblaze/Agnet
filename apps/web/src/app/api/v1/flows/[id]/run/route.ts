import { fail, ok } from "@/lib/api-response";
import { getFlow, startFlowRun } from "@/lib/agentguard/flows";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const flow = await getFlow(id);
    if (!flow) return fail("not_found", "flow not found", 404);
    const body = await req.json().catch(() => ({}));
    const prdText = typeof body.prd_text === "string" ? body.prd_text : "";
    if (!prdText.trim()) return fail("invalid_body", "prd_text required");
    const run = await startFlowRun(id, prdText);
    return ok(run, 201);
  } catch (e) {
    return fail("run_flow_failed", e instanceof Error ? e.message : "error", 500);
  }
}
