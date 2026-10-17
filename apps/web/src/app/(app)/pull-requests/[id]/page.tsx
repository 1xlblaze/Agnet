import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";

export default async function PRDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pr = await apiGet<any>(`/api/v1/pull-requests/${id}`);

  return (
    <div className="space-y-8">
      <PageHeader
        backHref="/pull-requests"
        backLabel="All pull requests"
        title={`#${pr.github_pr_number} ${pr.title}`}
        description={`Agent ${pr.author} · commit ${pr.head_sha.slice(0, 7)}`}
        action={<StatusBadge status={pr.status} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <p className="section-label">Base</p>
          <p className="mt-2 font-mono text-sm text-text-primary">{pr.base_sha}</p>
        </div>
        <div className="glass-card p-5">
          <p className="section-label">Head</p>
          <p className="mt-2 font-mono text-sm text-text-primary">{pr.head_sha}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="section-label">Diff</p>
        </div>
        <pre className="scrollbar-thin max-h-[32rem] overflow-auto p-5 text-xs leading-relaxed text-text-secondary">
          {pr.diff}
        </pre>
      </div>
    </div>
  );
}
