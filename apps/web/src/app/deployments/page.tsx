import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

type Dep = { id: string; environment: string; version: string; status: string; url?: string };

export default async function DeploymentsPage() {
  const res = await apiGet<{ items: Dep[] }>("/api/v1/deployments").catch(() => ({ items: [] as Dep[] }));
  const items = res.items || [];
  return (
    <section className="animate-rise">
      <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">Deployments</h1>
      <p className="mt-2 text-body">Preview and production rollout history.</p>
      <ul className="mt-8 space-y-3">
        {items.map((d) => (
          <li key={d.id} className="rounded-lg border border-hairline bg-surface-card px-5 py-4 shadow-card">
            <a href={`/deployments/${d.id}`} className="font-display text-xl capitalize text-ink hover:text-primary">
              {d.environment}
            </a>
            <p className="mt-1 text-sm text-body">
              {d.version} · {d.status}
            </p>
            {d.url ? (
              <a className="mt-2 inline-block text-sm text-primary underline" href={d.url}>
                {d.url}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
