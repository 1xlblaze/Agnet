import Link from "next/link";
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

function confidenceColor(n: number) {
  if (n >= 80) return "text-moss";
  if (n >= 60) return "text-ember";
  return "text-ember";
}

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
    <section className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foam sm:text-4xl">Projects</h1>
          <p className="mt-2 text-sand/80">Connect repositories, run baseline scans, and chat about gaps.</p>
        </div>
        <CreateProjectButton />
      </div>

      <ConnectGitHubForm />

      {error ? <p className="text-ember">{error}</p> : null}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sand/70">No projects yet. Connect a GitHub repo above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((p) => {
            const repo = p.repository;
            const fullName = repo ? `${repo.owner}/${repo.name}` : p.name;
            const confidence = p.report?.production_confidence;
            const gapCount = p.report?.gaps?.length ?? 0;
            return (
              <article key={p.id} className="card flex flex-col p-5 transition hover:border-moss/30">
                <div className="flex-1">
                  <Link href={`/projects/${p.id}`} className="font-display text-xl text-foam hover:text-moss">
                    {fullName}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-sand/75">{p.description || "—"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-ink/50 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-sand/60">
                      {p.status.replace(/_/g, " ")}
                    </span>
                    {typeof confidence === "number" ? (
                      <span className={`text-xs font-semibold ${confidenceColor(confidence)}`}>
                        {confidence}/100
                      </span>
                    ) : null}
                    {gapCount > 0 ? (
                      <span className="text-xs text-ember">{gapCount} gaps</span>
                    ) : typeof confidence === "number" ? (
                      <span className="text-xs text-moss">All clear</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-foam/10 pt-4">
                  <Link href={`/projects/${p.id}`} className="btn-secondary text-xs">
                    Report &amp; chat
                  </Link>
                  {repo ? <AnalyzeButton repositoryId={repo.id} label="Scan" /> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
