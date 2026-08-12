import { apiGet } from "@/lib/api";

export default async function AnalysisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiGet<any>(`/api/v1/analyses/${id}`);
  const findings = data.findings || [];
  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-foam">Analysis</h1>
        <p className="mt-2 text-sand/80">{data.analysis?.status}</p>
      </div>
      {data.risk ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-foam/10 p-4"><p className="text-xs text-sand/70">Risk</p><p className="font-display text-3xl">{data.risk.overall_risk}</p></div>
          <div className="border border-foam/10 p-4"><p className="text-xs text-sand/70">Blast Radius</p><p className="font-display text-3xl">{data.risk.blast_radius}</p></div>
          <div className="border border-foam/10 p-4"><p className="text-xs text-sand/70">Decision</p><p className="font-display text-3xl">{data.risk.decision}</p></div>
        </div>
      ) : null}
      <div className="space-y-4">
        {findings.map((f: any) => (
          <article key={f.id} className="border border-foam/10 bg-ink/30 p-4">
            <p className="text-xs uppercase tracking-wider text-ember">{f.severity} · {f.category}</p>
            <h2 className="font-display mt-1 text-2xl">{f.title}</h2>
            <p className="mt-2 text-sm text-sand/90">{f.description}</p>
            {f.file ? <p className="mt-2 font-mono text-xs">{f.file}:{f.line}</p> : null}
            <p className="mt-3 text-sm"><strong>Recommendation:</strong> {f.recommendation}</p>
            <p className="mt-1 text-xs text-sand/70">Confidence {(f.confidence * 100).toFixed(0)}% · {f.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
