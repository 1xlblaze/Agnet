import { apiGet } from "@/lib/api";
import { CreateProjectButton } from "./create-button";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
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
          <p className="mt-2 text-sand/80">Create and track AgentGuard-managed services.</p>
        </div>
        <CreateProjectButton />
      </div>
      {error ? <p className="text-ember">{error}</p> : null}
      <ul className="space-y-3">
        {items.map((p) => (
          <li key={p.id} className="border border-foam/10 bg-ink/30 px-4 py-3">
            <a href={`/projects/${p.id}`} className="font-display text-xl text-foam">
              {p.name}
            </a>
            <p className="text-sm text-sand/80">{p.description || "—"}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-moss">{p.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
