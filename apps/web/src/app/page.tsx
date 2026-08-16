import Link from "next/link";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ScoreGrid } from "@/components/ui/score-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadDashboard, type RepoReport } from "@/lib/agentguard/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let repos: RepoReport[] = [];
  let error = "";
  try {
    const data = await loadDashboard();
    repos = data.items ?? data.repositories_with_reports ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to load";
  }

  const totalGaps = repos.reduce((n, r) => n + (r.gap_count ?? r.report?.gaps?.length ?? 0), 0);
  const avgConfidence =
    repos.length > 0
      ? Math.round(
          repos.reduce(
            (n, r) => n + (r.production_confidence || r.report?.production_confidence || 0),
            0,
          ) / repos.length,
        )
      : 0;

  return (
    <div className="space-y-10">
      <PageHeader
        label="Dashboard"
        title="Repository health overview"
        description="Monitor baseline scores, track gaps across connected repos, and jump into reports or the assistant."
      />

      {error ? (
        <div className="glass-card border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          API /api/v1/dashboard failed: {error}
        </div>
      ) : null}

      {repos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Repositories" value={repos.length} hint="Connected and scanned" />
          <StatCard label="Avg confidence" value={avgConfidence} hint="Across all repos" accent />
          <StatCard
            label="Open gaps"
            value={totalGaps}
            hint={totalGaps === 0 ? "All checks passing" : "Needs attention"}
          />
        </div>
      ) : null}

      {repos.length === 0 ? (
        <EmptyState
          title="No repositories yet"
          description="Connect a GitHub repository to run a baseline scan and unlock scores, gap analysis, and the repository assistant."
          actionHref="/projects"
          actionLabel="Connect a repository"
        />
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-text-primary">Repositories</h2>
            <Link href="/projects" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          </div>
          <ul className="grid gap-4 lg:grid-cols-2">
            {repos.map((repo) => {
              const scores = repo.report?.scores ?? {};
              const confidence = repo.production_confidence || repo.report?.production_confidence || 0;
              const gapCount = repo.gap_count ?? repo.report?.gaps?.length ?? 0;
              return (
                <li key={repo.id}>
                  <Link href={`/projects/${repo.project_id}`} className="glass-card-hover block p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-xl text-text-primary">{repo.full_name}</h3>
                        {repo.github_url ? (
                          <p className="mt-1 truncate text-xs text-text-muted">{repo.github_url}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusBadge status={repo.status} />
                          {gapCount > 0 ? (
                            <span className="badge-danger">{gapCount} gap{gapCount === 1 ? "" : "s"}</span>
                          ) : (
                            <span className="badge-success">All clear</span>
                          )}
                        </div>
                      </div>
                      <ConfidenceRing value={confidence} size="sm" />
                    </div>
                    <div className="mt-6 border-t border-border pt-5">
                      <ScoreGrid scores={scores} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="glass-card p-6 sm:p-8">
        <p className="section-label">How it works</p>
        <h2 className="mt-2 font-display text-2xl text-text-primary">Baseline reports &amp; RAG assistant</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">1</div>
            <h3 className="font-medium text-text-primary">Connect &amp; scan</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Link a public GitHub repo. AgentGuard scans the tree and scores five production dimensions.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">2</div>
            <h3 className="font-medium text-text-primary">Review gaps</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Failed checks become actionable gaps grouped by security, reliability, performance, and more.
            </p>
          </div>
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">3</div>
            <h3 className="font-medium text-text-primary">Ask the assistant</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Chat retrieves evidence from your baseline to answer targeted questions — not generic summaries.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
