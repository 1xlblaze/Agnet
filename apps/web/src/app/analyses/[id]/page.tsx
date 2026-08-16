import { apiGet } from "@/lib/api";
import { FindingCard } from "@/components/findings/finding-card";
import { PipelineTimeline } from "@/components/ui/pipeline-timeline";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AnalysisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiGet<any>(`/api/v1/analyses/${id}`);
  const findings = data.findings || [];
  const decision = data.risk?.decision as "ALLOW" | "BLOCK" | "HUMAN_APPROVAL" | undefined;

  return (
    <section className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Analysis</p>
          <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">{data.analysis?.status}</h1>
        </div>
        {decision ? <StatusBadge label={decision} variant={decision} className="px-3 py-1 text-xs" /> : null}
      </div>

      <PipelineTimeline activeIndex={data.analysis?.status === "COMPLETED" ? 5 : 3} />

      {data.risk ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Overall Risk", value: data.risk.overall_risk },
            { label: "Blast Radius", value: data.risk.blast_radius },
            { label: "Decision", value: data.risk.decision, text: true },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-hairline bg-surface-card p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{m.label}</p>
              <p className={`mt-2 font-display text-3xl tracking-[-0.02em] text-ink ${m.text ? "text-xl" : ""}`}>{m.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Findings</h2>
        {findings.length === 0 ? (
          <p className="text-sm text-body">No findings recorded.</p>
        ) : (
          findings.map((f: any) => <FindingCard key={f.id} finding={f} />)
        )}
      </div>
    </section>
  );
}
