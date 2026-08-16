import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function PRDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pr = await apiGet<any>(`/api/v1/pull-requests/${id}`);
  return (
    <section className="animate-rise space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Pull Request</p>
        <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">
          #{pr.github_pr_number} {pr.title}
        </h1>
        <p className="mt-2 text-body">
          Agent {pr.author} · commit <span className="font-mono text-sm">{pr.head_sha}</span>
        </p>
        <div className="mt-3">
          <StatusBadge label={pr.status} variant="open" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Base</p>
          <p className="mt-2 font-mono text-sm text-ink">{pr.base_sha}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Head</p>
          <p className="mt-2 font-mono text-sm text-ink">{pr.head_sha}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-[#1e1e1e]">
        <div className="border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
          Diff
        </div>
        <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-[#d4d4d4]">{pr.diff}</pre>
      </div>
    </section>
  );
}
