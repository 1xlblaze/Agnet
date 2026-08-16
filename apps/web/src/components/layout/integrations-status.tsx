import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

type Integrations = {
  rag: { status: string; chunks: number; sources: string[] };
  llm: { provider: string; configured: boolean; reachable: boolean; models?: string[]; error?: string };
};

export async function IntegrationsStatus() {
  let data: Integrations | null = null;
  try {
    data = await apiGet<Integrations>("/api/v1/integrations/status");
  } catch {
    return null;
  }
  if (!data) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <StatusBadge label={`RAG ${data.rag.chunks} chunks`} variant={data.rag.status === "ready" ? "resolved" : "open"} />
      <StatusBadge
        label={data.llm.reachable ? "Cursor LLM" : data.llm.configured ? "LLM offline" : "LLM heuristic"}
        variant={data.llm.reachable ? "ALLOW" : "MEDIUM"}
      />
    </div>
  );
}
