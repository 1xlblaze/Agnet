import { ConfidenceRing } from "@/components/ui/confidence-ring";
import { PageHeader } from "@/components/ui/page-header";
import { ScoreGrid } from "@/components/ui/score-bar";
import { StatusBadge } from "@/components/ui/status-badge";
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
      <div className="space-y-4">
        <PageHeader title="Project not found" backHref="/projects" backLabel="All projects" />
        <div className="glass-card border-danger/30 bg-danger/5 p-8 text-center">
          <p className="text-danger">{error || "This project could not be loaded."}</p>
        </div>
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
    <div className="space-y-8">
      <PageHeader
        backHref="/projects"
        backLabel="All projects"
        title={fullName}
        description={project.description}
        action={
          repo ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {hasReport ? <ConfidenceRing value={confidence} /> : null}
              <AnalyzeButton repositoryId={repo.id} label="Rerun baseline" />
            </div>
          ) : null
        }
      />

      {repo ? (
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="badge-neutral">branch: {repo.default_branch}</span>
          <a
            href={`https://github.com/${fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            View on GitHub ↗
          </a>
        </div>
      ) : null}

      {!hasReport ? (
        <div className="glass-card border-warn/30 bg-warn/5 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warn/10 text-2xl">◎</div>
          <p className="font-display text-xl text-text-primary">No baseline report yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Run a scan to unlock dimension scores, gap analysis, and the repository assistant.
          </p>
          {repo ? (
            <div className="mt-6">
              <AnalyzeButton repositoryId={repo.id} label="Run baseline scan" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-2">
            <section className="glass-card p-5">
              <h2 className="section-label">Dimension scores</h2>
              <div className="mt-4">
                <ScoreGrid scores={scores} />
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-lg text-text-primary">Gaps &amp; fixes</h2>
              <RepoGaps gaps={gaps} confidence={confidence} />
            </section>
          </div>

          <div className="xl:col-span-3">
            {repo ? <RepoChat repositoryId={repo.id} repoName={fullName} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
