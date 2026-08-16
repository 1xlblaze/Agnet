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
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foam">Projects</h1>
          <p className="mt-2 text-sand/80">Connect GitHub repositories and run baseline scans.</p>
        </div>
        <CreateProjectButton />
      </div>

      <div className="mb-8">
        <ConnectGitHubForm />
      </div>

      {error ? <p className="text-ember">{error}</p> : null}
      <ul className="space-y-3">
        {items.map((p) => {
          const repo = p.repository;
          const fullName = repo ? `${repo.owner}/${repo.name}` : null;
          const confidence = p.report?.production_confidence;
          return (
            <li key={p.id} className="border border-foam/10 bg-ink/30 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <a href={`/projects/${p.id}`} className="font-display text-xl text-foam hover:underline">
                    {fullName || p.name}
                  </a>
                  <p className="text-sm text-sand/80">{p.description || "—"}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-moss">{p.status}</p>
                  {typeof confidence === "number" ? (
                    <p className="mt-1 text-xs text-sand/70">Production confidence: {confidence}</p>
                  ) : null}
                </div>
                {repo ? <AnalyzeButton repositoryId={repo.id} /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
