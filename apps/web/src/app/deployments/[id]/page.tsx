import { apiGet } from "@/lib/api";

export default async function DeploymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await apiGet<any>(`/api/v1/deployments/${id}`);
  return (
    <section>
      <h1 className="font-display text-4xl capitalize text-foam">{d.environment} deployment</h1>
      <p className="mt-2 text-sand/80">{d.status} · {d.version}</p>
      {d.url ? <p className="mt-4 text-moss">{d.url}</p> : null}
      <pre className="mt-8 overflow-auto border border-foam/10 bg-ink/40 p-4 text-xs">{JSON.stringify(d, null, 2)}</pre>
    </section>
  );
}
