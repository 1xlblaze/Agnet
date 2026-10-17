import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";

type PR = { id: string; title: string; github_pr_number: number; author: string; status: string; head_sha: string };

export default async function PullRequestsPage() {
  const res = await apiGet<{ items: PR[] }>("/api/v1/pull-requests").catch(() => ({ items: [] as PR[] }));
  const items = res.items || [];

  return (
    <div className="space-y-8">
      <PageHeader
        label="Pull Requests"
        title="Agent-generated changes"
        description="Review pull requests created by AI agents before they merge to production."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No pull requests"
          description="When agents open PRs against connected repositories, they'll appear here for review."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((pr) => (
            <li key={pr.id}>
              <Link href={`/pull-requests/${pr.id}`} className="glass-card-hover block p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg text-text-primary">
                      #{pr.github_pr_number} {pr.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {pr.author} · <span className="font-mono text-xs">{pr.head_sha.slice(0, 7)}</span>
                    </p>
                  </div>
                  <StatusBadge status={pr.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
