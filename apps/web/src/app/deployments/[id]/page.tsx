import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";

export default async function DeploymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await apiGet<any>(`/api/v1/deployments/${id}`);

  return (
    <div className="space-y-8">
      <PageHeader
        backHref="/deployments"
        backLabel="All deployments"
        title={`${d.environment} deployment`}
        description={d.version}
        action={<StatusBadge status={d.status} />}
      />

      {d.url ? (
        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          {d.url} ↗
        </a>
      ) : null}

      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="section-label">Raw payload</p>
        </div>
        <pre className="scrollbar-thin max-h-[32rem] overflow-auto p-5 text-xs text-text-secondary">
          {JSON.stringify(d, null, 2)}
        </pre>
      </div>
    </div>
  );
}
