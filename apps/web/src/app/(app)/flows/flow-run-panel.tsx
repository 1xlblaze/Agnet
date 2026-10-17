"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE_PRD = `# Payment retry API

- Add idempotent payment retry endpoint
- Persist retry attempts in PostgreSQL
- Emit events to the message bus

Acceptance: duplicate retries must not double-charge customers.
`;

export function FlowRunPanel({ flowId }: { flowId: string }) {
  const router = useRouter();
  const [prd, setPrd] = useState(SAMPLE_PRD);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/flows/${flowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prd_text: prd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "run failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <h3 className="font-display text-lg text-text-primary">Run with PRD</h3>
      <p className="text-sm text-text-secondary">
        Paste a product brief. The flow will parse goals, run agents, open a PR, and execute AgentGuard verification.
      </p>
      <textarea
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs leading-relaxed"
        rows={12}
        value={prd}
        onChange={(e) => setPrd(e.target.value)}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="button" className="btn-primary" disabled={running || !prd.trim()} onClick={run}>
        {running ? "Running flow…" : "Run flow"}
      </button>
    </div>
  );
}
