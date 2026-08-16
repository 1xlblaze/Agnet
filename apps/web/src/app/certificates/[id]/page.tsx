import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiGet } from "@/lib/api";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await apiGet<any>(`/api/v1/certificates/${id}`);

  return (
    <div className="space-y-8">
      <PageHeader
        label="Production certificate"
        title={c.decision}
        description="AgentGuard production readiness certificate"
      />

      <div className="glass-card border-accent/20 bg-accent/5 p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Risk score" value={c.risk_score} />
          <StatCard label="Blast radius" value={c.blast_radius} />
          <div className="glass-card p-5">
            <p className="section-label">Commit</p>
            <p className="mt-2 font-mono text-sm text-text-primary">{c.commit_sha}</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="section-label">Evidence</p>
        </div>
        <pre className="scrollbar-thin max-h-[32rem] overflow-auto p-5 text-xs text-text-secondary">
          {JSON.stringify(c.evidence, null, 2)}
        </pre>
      </div>
    </div>
  );
}
