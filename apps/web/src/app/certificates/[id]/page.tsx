import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await apiGet<any>(`/api/v1/certificates/${id}`);
  return (
    <section className="animate-rise rounded-xl border-2 border-hairline bg-surface-card p-8 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">AgentGuard Production Certificate</p>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-display text-4xl tracking-[-0.03em] text-ink">{c.decision}</h1>
        <StatusBadge label={c.decision} variant={c.decision === "AUTO DEPLOY" ? "ALLOW" : "MEDIUM"} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-hairline-soft bg-canvas-soft p-4">
          <p className="text-xs text-muted">Risk</p>
          <p className="font-display mt-1 text-3xl text-ink">{c.risk_score}</p>
        </div>
        <div className="rounded-lg border border-hairline-soft bg-canvas-soft p-4">
          <p className="text-xs text-muted">Blast Radius</p>
          <p className="font-display mt-1 text-3xl text-ink">{c.blast_radius}</p>
        </div>
        <div className="rounded-lg border border-hairline-soft bg-canvas-soft p-4">
          <p className="text-xs text-muted">Commit</p>
          <p className="mt-1 font-mono text-sm text-ink">{c.commit_sha}</p>
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-[#1e1e1e]">
        <pre className="overflow-auto p-4 font-mono text-xs text-[#d4d4d4]">{JSON.stringify(c.evidence, null, 2)}</pre>
      </div>
    </section>
  );
}
