import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiGet } from "@/lib/api";

export default async function AnalysisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiGet<any>(`/api/v1/analyses/${id}`);
  const findings = data.findings || [];

  return (
    <div className="space-y-8">
      <PageHeader
        label="Analysis"
        title="Security &amp; reliability findings"
        description={data.analysis?.status}
      />

      {data.risk ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Risk" value={data.risk.overall_risk} />
          <StatCard label="Blast radius" value={data.risk.blast_radius} />
          <StatCard label="Decision" value={data.risk.decision} accent />
        </div>
      ) : null}

      <div className="space-y-4">
        {findings.length === 0 ? (
          <div className="glass-card p-8 text-center text-text-secondary">No findings in this analysis.</div>
        ) : (
          findings.map((f: any) => (
            <article key={f.id} className="glass-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={f.severity === "high" ? "badge-danger" : f.severity === "medium" ? "badge-warn" : "badge-neutral"}>
                  {f.severity}
                </span>
                <span className="badge-neutral">{f.category}</span>
              </div>
              <h2 className="mt-3 font-display text-xl text-text-primary">{f.title}</h2>
              <p className="mt-2 text-sm text-text-secondary">{f.description}</p>
              {f.file ? (
                <p className="mt-2 font-mono text-xs text-text-muted">
                  {f.file}:{f.line}
                </p>
              ) : null}
              <p className="mt-3 rounded-lg bg-accent/5 px-3 py-2 text-sm text-text-secondary">
                <strong className="text-text-primary">Recommendation:</strong> {f.recommendation}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Confidence {(f.confidence * 100).toFixed(0)}% · {f.status}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
