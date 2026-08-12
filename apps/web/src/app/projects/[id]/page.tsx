import { apiGet } from "@/lib/api";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await apiGet<any>(`/api/v1/projects/${id}`);
  return (
    <section>
      <h1 className="font-display text-4xl text-foam">{project.name}</h1>
      <p className="mt-2 text-sand/80">{project.description}</p>
      <p className="mt-4 text-sm uppercase tracking-wider text-moss">{project.status}</p>
      <pre className="mt-8 overflow-auto border border-foam/10 bg-ink/40 p-4 text-xs">{JSON.stringify(project, null, 2)}</pre>
    </section>
  );
}
