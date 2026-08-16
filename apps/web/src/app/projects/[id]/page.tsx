import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await apiGet<any>(`/api/v1/projects/${id}`);
  return (
    <section className="animate-rise space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Project</p>
        <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">{project.name}</h1>
        <p className="mt-2 text-body">{project.description}</p>
        <div className="mt-3">
          <StatusBadge label={project.status} variant="ALLOW" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-[#1e1e1e]">
        <pre className="overflow-auto p-4 font-mono text-xs text-[#d4d4d4]">{JSON.stringify(project, null, 2)}</pre>
      </div>
    </section>
  );
}
