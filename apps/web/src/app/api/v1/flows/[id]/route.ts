import { fail, ok } from "@/lib/api-response";
import { getFlow, listFlowRuns, updateFlow } from "@/lib/agentguard/flows";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const flow = await getFlow(id);
    if (!flow) return fail("not_found", "flow not found", 404);
    const runs = await listFlowRuns(id);
    return ok({ flow, runs });
  } catch (e) {
    return fail("get_flow_failed", e instanceof Error ? e.message : "error", 500);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const flow = await updateFlow(id, {
      name: body.name,
      description: body.description,
      steps: body.steps,
    });
    if (!flow) return fail("not_found", "flow not found or is a system template", 404);
    return ok(flow);
  } catch (e) {
    return fail("update_flow_failed", e instanceof Error ? e.message : "error", 500);
  }
}
