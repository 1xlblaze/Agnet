import Link from "next/link";
import { loadDashboard, type RepoReport } from "@/lib/agentguard/dashboard";

export const dynamic = "force-dynamic";

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-foam/10 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-sand/80">{label}</span>
        <span className="font-display text-xl text-foam">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-foam/10">
        <div className="h-full bg-moss transition-all duration-700" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  let repos: RepoReport[] = [];
  let error = "";
  try {
    const data = await loadDashboard();
    repos = data.items ?? data.repositories_with_reports ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to load";
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="animate-[fadeIn_0.5s_ease]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-sand/65">Dashboard</p>
        <h1 className="font-display mt-2 text-3xl text-foam sm:text-4xl">Per-repository reports</h1>
        <p className="mt-2 max-w-xl text-sm text-sand/80">
          Connect repos, run baseline scans, and use the RAG assistant to ask where each repository lacks.
        </p>
        {error ? <p className="mt-3 text-ember">API /api/v1/dashboard failed: {error}</p> : null}
      </section>

      {repos.length === 0 ? (
        <p className="text-sm text-sand/70">
          No repositories yet.{" "}
          <Link className="text-moss underline" href="/projects">
            Connect a GitHub repo
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {repos.map((repo) => {
            const scores = repo.report?.scores ?? {};
            const confidence = repo.production_confidence || repo.report?.production_confidence || 0;
            const gapCount = repo.gap_count ?? repo.report?.gaps?.length ?? 0;
            return (
              <li key={repo.id} className="border border-foam/10 bg-ink/35 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/projects/${repo.project_id}`} className="font-display text-2xl text-foam hover:underline">
                      {repo.full_name}
                    </Link>
                    {repo.github_url ? (
                      <p className="mt-1 text-xs text-sand/60">{repo.github_url}</p>
                    ) : null}
                    {gapCount > 0 ? (
                      <p className="mt-2 text-xs text-ember">{gapCount} gap{gapCount === 1 ? "" : "s"} found in baseline</p>
                    ) : (
                      <p className="mt-2 text-xs text-moss">All baseline checks passed</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex border border-moss/40 bg-moss/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foam">
                      {repo.status.replace(/_/g, " ")}
                    </span>
                    <Link
                      href={`/projects/${repo.project_id}`}
                      className="text-xs text-moss hover:underline"
                    >
                      View report &amp; chat →
                    </Link>
                  </div>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-sand/65">Production confidence</p>
                    <p className="font-display mt-1 text-5xl text-foam">{confidence}</p>
                  </div>
                  <div className="max-w-md">
                    <Score label="Security" value={scores.security ?? 0} />
                    <Score label="Reliability" value={scores.reliability ?? 0} />
                    <Score label="Performance" value={scores.performance ?? 0} />
                    <Score label="Architecture" value={scores.architecture ?? 0} />
                    <Score label="Database" value={scores.database ?? 0} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="animate-[fadeIn_0.55s_ease]">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sand/65">Storage</p>
            <h2 className="font-display mt-1 text-2xl text-foam sm:text-3xl">How reports work</h2>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-sand/80">
          Each repo gets a baseline report with dimension scores and evidence. Failed checks become <strong>gaps</strong> you
          can explore on the project page. The RAG assistant retrieves relevant gap evidence to answer questions like
          &ldquo;where does this repo lack?&rdquo; or &ldquo;what security issues exist?&rdquo;
        </p>
      </section>
    </div>
  );
}
