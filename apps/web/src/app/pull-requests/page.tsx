import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

type PR = { id: string; title: string; github_pr_number: number; author: string; status: string; head_sha: string };

export default async function PullRequestsPage() {
  const res = await apiGet<{ items: PR[] }>("/api/v1/pull-requests").catch(() => ({ items: [] as PR[] }));
  const items = res.items || [];
  return (
    <section className="animate-rise">
      <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">Pull Requests</h1>
      <p className="mt-2 text-body">AI agent changes awaiting verification evidence.</p>
      <ul className="mt-8 space-y-3">
        {items.map((pr) => (
          <li key={pr.id} className="rounded-lg border border-hairline bg-surface-card px-5 py-4 shadow-card">
            <a href={`/pull-requests/${pr.id}`} className="font-display text-xl text-ink hover:text-primary">
              #{pr.github_pr_number} {pr.title}
            </a>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-body">
              <span>{pr.author}</span>
              <span className="font-mono text-xs">{pr.head_sha}</span>
              <StatusBadge label={pr.status} variant="open" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
