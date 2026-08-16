import Link from "next/link";
import { apiGet } from "@/lib/api";
import { extractGapsFromReport } from "@/lib/agentguard/repo-rag";
import { AnalyzeButton } from "../analyze-button";
import { RepoChat } from "../repo-chat";
import { RepoGaps } from "../repo-gaps";

type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  status: string;
  repository?: {
    id: string;
    owner: string;
    name: string;
    status: string;
    default_branch: string;
  } | null;
  report?: {
    summary: Record<string, unknown> | null;
    gaps: Array<{ dimension: string; check: string; detail: string; recommendation?: string }>;
    gap_count: number;
    production_confidence: number;
    has_report: boolean;
  } | null;
};

function ConfidenceRing({ value }: { value: number }) {
  const color = value >= 80 ? "#1f6f5b" : value >= 60 ? "#c45c26" : "#c45c26";
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="144" height="144" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(232,243,239,0.1)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-4xl text-foam">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-sand/60">confidence</p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-moss" : value >= 60 ? "bg-ember/80" : "bg-ember";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-sand/80">{label}</span>
        <span className="font-semibold text-foam">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foam/10">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let project: ProjectDetail | null = null;
  let error = "";

  try {
    project = await apiGet<ProjectDetail>(`/api/v1/projects/${id}`);
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to load";
  }

  if (error || !project) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ember">{error || "Project not found"}</p>
        <Link href="/projects" className="mt-4 inline-block text-sm text-moss hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const repo = project.repository;
  const fullName = repo ? `${repo.owner}/${repo.name}` : project.name;
  const report = project.report;
  const summary = report?.summary;
  const scores = (summary?.scores as Record<string, number>) || {};
  const confidence = report?.production_confidence ?? Number(summary?.production_confidence ?? 0);
  const gaps = (report?.gaps?.length ? report.gaps : extractGapsFromReport(summary)) as import("@/lib/agentguard/repo-rag").GapItem[];
  const hasReport = report?.has_report ?? Boolean(summary);

  return (
    <div className="animate-rise space-y-8">
      {/* Header */}
      <section className="card p-6 sm:p-8">
        <Link href="/projects" className="text-xs text-sand/60 hover:text-moss">
          ← All projects
        </Link>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl text-foam sm:text-4xl">{fullName}</h1>
            <p className="mt-2 text-sand/80">{project.description}</p>
            {repo ? (
              <a
                href={`https://github.com/${fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-moss hover:underline"
              >
                View on GitHub ↗
              </a>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-foam/20 px-3 py-1 text-xs uppercase tracking-wider text-sand/70">
                {project.status.replace(/_/g, " ")}
              </span>
              {repo ? (
                <span className="rounded-full border border-foam/15 px-3 py-1 text-xs text-sand/60">
                  branch: {repo.default_branch}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-3">
            {hasReport ? <ConfidenceRing value={confidence} /> : null}
            {repo ? <AnalyzeButton repositoryId={repo.id} label="Rerun baseline" /> : null}
          </div>
        </div>
      </section>

      {!hasReport ? (
        <div className="card border-ember/30 bg-ember/10 p-8 text-center">
          <p className="text-lg font-medium text-foam">No baseline report yet</p>
          <p className="mt-2 text-sm text-sand/75">Run a scan to unlock scores, gap analysis, and the repository assistant.</p>
          {repo ? (
            <div className="mt-6">
              <AnalyzeButton repositoryId={repo.id} label="Run baseline scan" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-5">
          {/* Left: Scores + Gaps */}
          <div className="space-y-6 xl:col-span-2">
            <section className="card p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sand/65">Dimension scores</h2>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Security" value={scores.security ?? 0} />
                <ScoreBar label="Reliability" value={scores.reliability ?? 0} />
                <ScoreBar label="Performance" value={scores.performance ?? 0} />
                <ScoreBar label="Architecture" value={scores.architecture ?? 0} />
                <ScoreBar label="Database" value={scores.database ?? 0} />
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl text-foam">Gaps &amp; fixes</h2>
              <RepoGaps gaps={gaps} confidence={confidence} />
            </section>
          </div>

          {/* Right: Chat */}
          <div className="xl:col-span-3">
            {repo ? <RepoChat repositoryId={repo.id} repoName={fullName} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
