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
    gaps: Array<{ dimension: string; check: string; detail: string }>;
    gap_count: number;
    production_confidence: number;
    has_report: boolean;
    baseline: Record<string, unknown> | null;
  } | null;
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-foam/10 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-sand/80">{label}</span>
        <span className="font-display text-foam">{value}</span>
      </div>
      <div className="mt-1.5 h-1 bg-foam/10">
        <div className="h-full bg-moss" style={{ width: `${Math.min(100, value)}%` }} />
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
    return <p className="text-ember">{error || "Project not found"}</p>;
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
    <div className="space-y-8">
      <section>
        <Link href="/projects" className="text-xs text-sand/60 hover:text-moss">
          ← Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foam">{fullName}</h1>
            <p className="mt-2 text-sand/80">{project.description}</p>
            {repo ? (
              <a
                href={`https://github.com/${fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-moss hover:underline"
              >
                github.com/{fullName}
              </a>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-foam/20 px-2.5 py-1 text-xs uppercase tracking-wider text-sand/70">
              {project.status}
            </span>
            {repo ? <AnalyzeButton repositoryId={repo.id} label="Rerun baseline" /> : null}
          </div>
        </div>
      </section>

      {!hasReport ? (
        <div className="border border-ember/30 bg-ember/10 px-4 py-6">
          <p className="text-sm text-foam">No baseline report yet.</p>
          <p className="mt-1 text-sm text-sand/70">
            Run a baseline scan to generate scores, gap analysis, and enable the RAG assistant.
          </p>
          {repo ? (
            <div className="mt-4">
              <AnalyzeButton repositoryId={repo.id} label="Run baseline scan" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-6">
            <div className="border border-foam/10 bg-ink/30 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-sand/65">Production confidence</p>
              <p className="font-display mt-2 text-6xl text-foam">{confidence}</p>
              <div className="mt-6 max-w-sm">
                <ScoreBar label="Security" value={scores.security ?? 0} />
                <ScoreBar label="Reliability" value={scores.reliability ?? 0} />
                <ScoreBar label="Performance" value={scores.performance ?? 0} />
                <ScoreBar label="Architecture" value={scores.architecture ?? 0} />
                <ScoreBar label="Database" value={scores.database ?? 0} />
              </div>
            </div>

            <div>
              <h2 className="mb-4 font-display text-2xl text-foam">Gaps & weaknesses</h2>
              <RepoGaps gaps={gaps} confidence={confidence} />
            </div>
          </section>

          <section>
            {repo ? <RepoChat repositoryId={repo.id} /> : null}
          </section>
        </div>
      )}
    </div>
  );
}
