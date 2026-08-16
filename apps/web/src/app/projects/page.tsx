import Link from "next/link";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { AnalyzeButton } from "./analyze-button";
import { ConnectGitHubForm } from "./connect-github-form";
import { CreateProjectButton } from "./create-button";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  repository?: {
    id: string;
    owner: string;
    name: string;
    status: string;
  } | null;
  report?: {
    production_confidence?: number;
    gaps?: Array<{ dimension: string }>;
  } | null;
};

export default async function ProjectsPage() {
  let items: Project[] = [];
  let error = "";
  try {
    const res = await apiGet<{ items: Project[] }>("/api/v1/projects");
    items = res.items || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "failed";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        label="Projects"
        title="Your repositories"
        description="Connect GitHub repos, run baseline scans, and explore gaps with the repository assistant."
        action={<CreateProjectButton />}
      />

      <ConnectGitHubForm />

      {error ? (
        <div className="glass-card border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Enter a GitHub owner/repo above to connect and automatically run a baseline scan."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const repo = p.repository;
            const fullName = repo ? `${repo.owner}/${repo.name}` : p.name;
            const confidence = p.report?.production_confidence;
            const gapCount = p.report?.gaps?.length ?? 0;
            return (
              <article key={p.id} className="glass-card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/projects/${p.id}`} className="font-display text-lg text-text-primary hover:text-accent">
                      {fullName}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{p.description || "No description"}</p>
                  </div>
                  {typeof confidence === "number" ? <ConfidenceRing value={confidence} size="sm" /> : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  {gapCount > 0 ? (
                    <span className="badge-danger">{gapCount} gaps</span>
                  ) : typeof confidence === "number" ? (
                    <span className="badge-success">All clear</span>
                  ) : (
                    <span className="badge-neutral">Not scanned</span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
                  <Link href={`/projects/${p.id}`} className="btn-secondary text-xs">
                    Report &amp; chat
                  </Link>
                  {repo ? <AnalyzeButton repositoryId={repo.id} label="Rescan" /> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
