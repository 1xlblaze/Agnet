import Link from "next/link";

export default function StudioLandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="section-label">Agentic development platform</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-text-primary sm:text-5xl lg:text-6xl">
            From PRD to production — with agents you can trust
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-text-secondary">
            AgentGuard Studio combines OpenHands-style coding agents with a verification control plane. Define flows,
            ship features, and let policy — not vibes — decide what reaches production.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/flows/new" className="btn-primary px-6 py-3 text-base">Create your first flow</Link>
            <Link href="/dashboard" className="btn-ghost px-6 py-3 text-base">Open dashboard</Link>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { n: "GUI + flows", d: "Visual PRD → plan → code → verify → deploy pipelines" },
              { n: "Coding agents", d: "Sandboxed implementation sessions (Codex / multi-agent ready)" },
              { n: "Control plane", d: "Blast radius, evidence, certificates, rollback" },
            ].map((card) => (
              <div key={card.n} className="glass-card p-6">
                <h3 className="font-display text-lg text-text-primary">{card.n}</h3>
                <p className="mt-2 text-sm text-text-secondary">{card.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prd" className="border-t border-border bg-surface/40 px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="section-label">PRD → Production</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">One loop for agentic product delivery</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Write the PRD", "Goals, constraints, and acceptance criteria in plain language."],
              ["2", "Agents execute", "Planning and coding agents work in sandboxed sessions."],
              ["3", "AgentGuard verifies", "Analysis, tests, preview deploy, and policy gate."],
              ["4", "Ship with evidence", "Immutable certificate when deterministic rules allow."],
            ].map(([n, title, desc]) => (
              <li key={n} className="glass-card p-5">
                <span className="text-sm font-semibold text-accent">{n}</span>
                <h3 className="mt-2 font-medium text-text-primary">{title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{desc}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link href="/flows" className="text-sm font-medium text-accent hover:underline">Browse flow templates →</Link>
          </div>
        </div>
      </section>

      <section id="flows" className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="section-label">User-created flows</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">Compose your own agent pipeline</h2>
          <p className="mt-4 max-w-2xl text-text-secondary">
            Toggle steps, reorder the pipeline, and save custom flows for your team — like OpenHands workflows, wired to
            AgentGuard policy and production certificates.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-text-secondary">
            <li className="flex gap-2"><span className="text-accent">✓</span> PRD intake &amp; agent planning</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Scaffold, code, open PR</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Analyze, verify, preview, deploy</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Optional human approval gate</li>
          </ul>
        </div>
      </section>

      <section id="platform" className="border-t border-border px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl glass-card p-8 sm:p-12">
          <h2 className="font-display text-2xl text-text-primary">Built for teams shipping with AI agents</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Use the Studio for agentic development; use AgentGuard when you need production safety — same repo, same
            loop, one platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/flows/new" className="btn-primary">Start building</Link>
            <a
              href="https://docs.openhands.dev"
              className="btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              Compare with OpenHands docs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
