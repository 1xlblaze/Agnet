import { ok } from "@/lib/api-response";
import { checkCursorApi } from "@/lib/agentguard/llm";
import { ragStatus } from "@/lib/agentguard/rag";

export async function GET() {
  const [rag, llm] = await Promise.all([Promise.resolve(ragStatus()), checkCursorApi()]);
  return ok({
    rag,
    llm,
    ready: rag.status === "ready",
  });
}
