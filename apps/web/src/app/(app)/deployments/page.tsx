import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";

type Dep = { id: string; environment: string; version: string; status: string; url?: string };

export default async function DeploymentsPage() {
  const res = await apiGet<{ items: Dep[] }>("/api/v1/deployments").catch(() => ({ items: [] as Dep[] }));
  const items = res.items || [];

  return (
    <div className="space-y-8">
      <PageHeader
        label="Deployments"
        title="Environment releases"
        description="Track deployments across environments and verify agent-generated changes before they go live."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No deployments"
          description="Deployment records will appear here once releases are tracked through AgentGuard."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/deployments/${d.id}`} className="glass-card-hover block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg capitalize text-text-primary">{d.environment}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{d.version}</p>
                    {d.url ? (
                      <p className="mt-2 truncate text-xs text-accent">{d.url}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
