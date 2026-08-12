import { apiGet } from "@/lib/api";

export default async function PRDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pr = await apiGet<any>(`/api/v1/pull-requests/${id}`);
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-foam">#{pr.github_pr_number} {pr.title}</h1>
        <p className="mt-2 text-sand/80">Agent {pr.author} · commit {pr.head_sha}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-foam/10 bg-ink/30 p-4">
          <p className="text-xs uppercase tracking-wider text-sand/70">Base</p>
          <p className="font-mono text-sm">{pr.base_sha}</p>
        </div>
        <div className="border border-foam/10 bg-ink/30 p-4">
          <p className="text-xs uppercase tracking-wider text-sand/70">Head</p>
          <p className="font-mono text-sm">{pr.head_sha}</p>
        </div>
      </div>
      <pre className="overflow-auto border border-foam/10 bg-ink/50 p-4 text-xs text-sand">{pr.diff}</pre>
    </section>
  );
}
