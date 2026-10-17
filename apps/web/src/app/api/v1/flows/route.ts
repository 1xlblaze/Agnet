import { fail, ok } from "@/lib/api-response";
import { createFlow, listFlows } from "@/lib/agentguard/flows";

export async function GET() {
  try {
    const items = await listFlows();
    return ok({ items });
  } catch (e) {
    return fail("list_flows_failed", e instanceof Error ? e.message : "error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return fail("invalid_body", "name required");
    const flow = await createFlow({
      name: body.name,
      description: body.description,
      steps: body.steps,
    });
    return ok(flow, 201);
  } catch (e) {
    return fail("create_flow_failed", e instanceof Error ? e.message : "error", 500);
  }
}
