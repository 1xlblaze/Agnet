import { apiGet } from "@/lib/api";

type Dep = { id: string; environment: string; version: string; status: string; url?: string };

export default async function DeploymentsPage() {
  const res = await apiGet<{ items: Dep[] }>("/api/v1/deployments").catch(() => ({ items: [] as Dep[] }));
  const items = res.items || [];
  return (
    <section>
      <h1 className="font-display text-4xl text-foam">Deployments</h1>
      <ul className="mt-8 space-y-3">
        {items.map((d) => (
          <li key={d.id} className="border border-foam/10 bg-ink/30 px-4 py-3">
            <a href={`/deployments/${d.id}`} className="font-display text-xl capitalize">{d.environment}</a>
            <p className="text-sm text-sand/80">{d.version} · {d.status}</p>
            {d.url ? <a className="text-sm text-moss underline" href={d.url}>{d.url}</a> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
