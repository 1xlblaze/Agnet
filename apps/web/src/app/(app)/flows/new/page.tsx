import { PageHeader } from "@/components/ui/page-header";
import { FlowBuilder } from "../flow-builder";

export default function NewFlowPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        label="Agent Studio"
        title="New flow"
        description="Compose a custom PRD → production pipeline. Defaults match the OpenHands-style agent loop with AgentGuard verification."
      />
      <FlowBuilder />
    </div>
  );
}
