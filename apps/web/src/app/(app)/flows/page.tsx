import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import type { FlowStep } from "@/lib/agentguard/flow-types";

type Flow = {
  id: string;
  name: string;
  description: string;
  is_template: boolean;
  steps: FlowStep[];
};

export default async function FlowsPage() {
  let items: Flow[] = [];
  let error = "";
  try {
    const res = await apiGet<{ items: Flow[] }>("/api/v1/flows");
    items = res.items || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "failed";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        label="Agent Studio"
        title="Flows"
        description="User-defined pipelines from PRD intake through coding agents, verification, and production deploy."
        action={
          <Link href="/flows/new" className="btn-primary">
            New flow
          </Link>
        }
      />

      {error ? (
        <div className="glass-card border-danger/30 bg-danger/5 p-4 text-sm text-danger">Failed to load flows: {error}</div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No flows yet"
          description="Start from the PRD → Production template or compose your own agent pipeline."
          actionHref="/flows/new"
          actionLabel="Create flow"
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((flow) => {
            const enabled = flow.steps.filter((s) => s.enabled).length;
            return (
              <li key={flow.id}>
                <Link href={`/flows/${flow.id}`} className="glass-card-hover block p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-text-primary">{flow.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary line-clamp-2">{flow.description}</p>
                    </div>
                    {flow.is_template ? <span className="badge-success shrink-0">Template</span> : <StatusBadge status="READY" />}
                  </div>
                  <p className="mt-4 text-xs text-text-muted">{enabled} active steps</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
