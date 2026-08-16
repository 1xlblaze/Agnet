import { apiGet } from "@/lib/api";
import { ConfidenceRing } from "@/components/ui/confidence-ring";
import { PipelineTimeline } from "@/components/ui/pipeline-timeline";
import { StatusBadge } from "@/components/ui/status-badge";

type Dashboard = {
  production_confidence: number;
  security: number;
  reliability: number;
  performance: number;
  architecture: number;
  database: number;
  latest_pr?: { id: string; title: string; github_pr_number: number; author: string };
  latest_risk?: { overall_risk: number; blast_radius: number; decision: string };
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-body">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-hairline-soft">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  let data: Dashboard | null = null;
  let error = "";
  try {
    data = await apiGet<Dashboard>("/api/v1/dashboard");
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to load";
  }

  return (
    <section className="animate-rise space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-xl border border-hairline bg-surface-card p-8 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Production Confidence</p>
          <div className="mt-6 flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <ConfidenceRing value={data?.production_confidence ?? 0} />
            <div className="w-full max-w-sm space-y-4">
              <ScoreBar label="Security" value={data?.security ?? 0} />
              <ScoreBar label="Reliability" value={data?.reliability ?? 0} />
              <ScoreBar label="Performance" value={data?.performance ?? 0} />
              <ScoreBar label="Architecture" value={data?.architecture ?? 0} />
              <ScoreBar label="Database" value={data?.database ?? 0} />
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>

        <aside className="rounded-xl border border-hairline bg-surface-card p-8 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Latest Pull Request</p>
          {data?.latest_pr ? (
            <div className="mt-5 space-y-4">
              <a href={`/pull-requests/${data.latest_pr.id}`} className="font-display text-2xl tracking-[-0.02em] text-ink hover:text-primary">
                #{data.latest_pr.github_pr_number} {data.latest_pr.title}
              </a>
              <p className="text-sm text-body">Agent: {data.latest_pr.author}</p>
              {data.latest_risk ? (
                <div className="space-y-3 border-t border-hairline-soft pt-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={`Risk ${data.latest_risk.overall_risk}`} variant="MEDIUM" />
                    <StatusBadge label={`Blast ${data.latest_risk.blast_radius}`} variant="LOW" />
                    <StatusBadge
                      label={data.latest_risk.decision}
                      variant={data.latest_risk.decision as "ALLOW" | "BLOCK" | "HUMAN_APPROVAL"}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-body">No pull requests analyzed yet. Run the e2e flow to seed demo data.</p>
          )}
        </aside>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-6 shadow-card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Verification Pipeline</p>
        <PipelineTimeline activeIndex={data?.latest_risk ? 5 : 2} />
      </div>
    </section>
  );
}
