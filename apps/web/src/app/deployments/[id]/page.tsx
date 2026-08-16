import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function DeploymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await apiGet<any>(`/api/v1/deployments/${id}`);
  return (
    <section className="animate-rise space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Deployment</p>
        <h1 className="font-display text-4xl capitalize tracking-[-0.03em] text-ink">{d.environment}</h1>
        <p className="mt-2 text-body">
          {d.version} · {d.status}
        </p>
        <div className="mt-3">
          <StatusBadge label={d.status} variant={d.status === "COMPLETED" ? "ALLOW" : "MEDIUM"} />
        </div>
      </div>
      {d.url ? (
        <a className="text-primary underline" href={d.url}>
          {d.url}
        </a>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-hairline bg-[#1e1e1e]">
        <pre className="overflow-auto p-4 font-mono text-xs text-[#d4d4d4]">{JSON.stringify(d, null, 2)}</pre>
      </div>
    </section>
  );
}
