import { apiGet } from "@/lib/api";

type Dashboard = {
  production_confidence: number;
  security: number;
  reliability: number;
  performance: number;
  architecture: number;
  database: number;
  latest_pr?: { title: string; github_pr_number: number; author: string };
  latest_risk?: { overall_risk: number; blast_radius: number; decision: string };
};

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-foam/10 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sand/80">{label}</span>
        <span className="font-display text-2xl text-foam">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-foam/10">
        <div className="h-full bg-moss transition-all duration-700" style={{ width: `${Math.min(100, value)}%` }} />
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
    <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
      <div className="animate-[fadeIn_0.8s_ease]">
        <p className="text-sm uppercase tracking-[0.2em] text-sand/70">Production Confidence</p>
        <p className="font-display mt-2 text-7xl font-bold text-foam md:text-8xl">
          {data ? data.production_confidence : "—"}
          <span className="text-3xl text-sand/70"> / 100</span>
        </p>
        {error ? <p className="mt-4 text-ember">{error}</p> : null}
        <div className="mt-8 max-w-md">
          <Score label="Security" value={data?.security ?? 0} />
          <Score label="Reliability" value={data?.reliability ?? 0} />
          <Score label="Performance" value={data?.performance ?? 0} />
          <Score label="Architecture" value={data?.architecture ?? 0} />
          <Score label="Database" value={data?.database ?? 0} />
        </div>
      </div>
      <aside className="self-start border border-foam/15 bg-ink/40 p-6 backdrop-blur-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-sand/70">Latest PR</p>
        {data?.latest_pr ? (
          <div className="mt-4 space-y-3">
            <p className="font-display text-2xl text-foam">#{data.latest_pr.github_pr_number}</p>
            <p className="text-lg">{data.latest_pr.title}</p>
            <p className="text-sm text-sand/80">Agent: {data.latest_pr.author}</p>
            {data.latest_risk ? (
              <div className="mt-6 space-y-2 border-t border-foam/10 pt-4 text-sm">
                <p>
                  Risk: <strong>{data.latest_risk.overall_risk} / 100</strong>
                </p>
                <p>
                  Blast Radius: <strong>{data.latest_risk.blast_radius} / 100</strong>
                </p>
                <p className="font-display text-xl text-moss">{data.latest_risk.decision}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sand/80">
            No pull requests analyzed yet. Run <code>make e2e</code>.
          </p>
        )}
      </aside>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: none; } }`}</style>
    </section>
  );
}
