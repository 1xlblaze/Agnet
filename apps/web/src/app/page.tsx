import Link from "next/link";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type RepoReport = {
  id: string;
  full_name: string;
  github_url?: string;
  project_id: string;
  status: string;
  production_confidence: number;
  report?: {
    production_confidence?: number;
    scores?: {
      security?: number;
      reliability?: number;
      performance?: number;
      architecture?: number;
      database?: number;
    };
  } | null;
};

type Dashboard = {
  items?: RepoReport[];
  repositories_with_reports?: RepoReport[];
};

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
    const data = await apiGet<Dashboard>("/api/v1/dashboard");
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
          Each connected repo keeps its own AgentGuard report document in Supabase. Scores belong to that repo — not a global mix.
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
                  </div>
                  <span className="inline-flex border border-moss/40 bg-moss/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foam">
                    {repo.status.replace(/_/g, " ")}
                  </span>
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
          Reports live in Supabase table <code className="text-foam">agentguard_reports</code> as JSON documents (
          <code className="text-foam">baseline</code>, <code className="text-foam">pr</code>,{" "}
          <code className="text-foam">summary</code>). Re-running baseline or PR analysis upserts the same key and bumps{" "}
          <code className="text-foam">version</code>.
        </p>
      </section>
    </div>
  );
}
