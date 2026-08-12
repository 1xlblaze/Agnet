import { apiGet } from "@/lib/api";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await apiGet<any>(`/api/v1/certificates/${id}`);
  return (
    <section className="border border-foam/20 bg-ink/50 p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-sand/70">AgentGuard Production Certificate</p>
      <h1 className="font-display mt-4 text-4xl text-foam">{c.decision}</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div><p className="text-xs text-sand/70">Risk</p><p className="font-display text-3xl">{c.risk_score}</p></div>
        <div><p className="text-xs text-sand/70">Blast Radius</p><p className="font-display text-3xl">{c.blast_radius}</p></div>
        <div><p className="text-xs text-sand/70">Commit</p><p className="font-mono text-sm">{c.commit_sha}</p></div>
      </div>
      <pre className="mt-8 overflow-auto text-xs text-sand/80">{JSON.stringify(c.evidence, null, 2)}</pre>
    </section>
  );
}
