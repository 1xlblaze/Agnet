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
    <section className="animate-rise">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">Projects</h1>
          <p className="mt-2 text-body">Create and track AgentGuard-managed services.</p>
        </div>
        <CreateProjectButton />
      </div>
      {error ? <p className="text-danger">{error}</p> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <li key={p.id} className="rounded-lg border border-hairline bg-surface-card p-5 shadow-card transition hover:border-hairline-soft">
            <a href={`/projects/${p.id}`} className="font-display text-xl text-ink hover:text-primary">
              {p.name}
            </a>
            <p className="mt-2 text-sm text-body">{p.description || "—"}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-success">{p.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
