import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import type { FlowStepState } from "@/lib/agentguard/flow-types";
import { FlowRunPanel } from "../flow-run-panel";
import { FlowBuilder } from "../flow-builder";

type Flow = {
  id: string;
  name: string;
  description: string;
  is_template: boolean;
  steps: Array<{ id: string; name: string; enabled: boolean; type: string }>;
};

type FlowRun = {
  id: string;
  status: string;
  created_at: string;
  step_states: FlowStepState[];
  output: Record<string, unknown>;
  error: string | null;
};

export default async function FlowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let flow: Flow | null = null;
  let runs: FlowRun[] = [];
  try {
    const res = await apiGet<{ flow: Flow; runs: FlowRun[] }>(`/api/v1/flows/${id}`);
    flow = res.flow;
    runs = res.runs || [];
  } catch {
    notFound();
  }
  if (!flow) notFound();

  const latest = runs[0];

  return (
    <div className="space-y-8">
      <PageHeader
        label="Agent Studio"
        title={flow.name}
        description={flow.description}
        backHref="/flows"
        backLabel="All flows"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <FlowRunPanel flowId={flow.id} />
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-display text-lg text-text-primary">Active steps</h3>
            <ol className="mt-4 space-y-2 text-sm">
              {flow.steps
                .filter((s) => s.enabled)
                .map((s, i) => (
                  <li key={s.id} className="flex gap-2 text-text-secondary">
                    <span className="text-accent">{i + 1}.</span>
                    {s.name}
                  </li>
                ))}
            </ol>
          </div>

          {latest ? (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg text-text-primary">Latest run</h3>
                <StatusBadge status={latest.status} />
              </div>
              {latest.error ? <p className="mt-2 text-sm text-danger">{latest.error}</p> : null}
              <ul className="mt-4 space-y-2">
                {latest.step_states.map((s) => (
                  <li key={s.step_id} className="rounded-lg border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-primary">{s.type.replace(/_/g, " ")}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    {s.message ? <p className="mt-1 text-xs text-text-muted">{s.message}</p> : null}
                  </li>
                ))}
              </ul>
              {latest.output?.certificate_id ? (
                <p className="mt-4 text-xs text-text-muted">
                  Certificate id: <code>{String(latest.output.certificate_id)}</code>
                </p>
              ) : null}
              {latest.output?.pull_request_id ? (
                <p className="mt-2 text-xs text-text-muted">
                  Pull request id: <code>{String(latest.output.pull_request_id)}</code>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="glass-card p-6 text-sm text-text-secondary">No runs yet. Execute the flow with a PRD to see step-by-step progress.</div>
          )}
        </div>
      </div>

      {!flow.is_template ? (
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl text-text-primary">Edit flow</h2>
          <FlowBuilder flowId={flow.id} initialName={flow.name} initialDescription={flow.description} />
        </section>
      ) : null}
    </div>
  );
}
