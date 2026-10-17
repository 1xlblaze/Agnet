"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  buildDefaultSteps,
  FLOW_STEP_CATALOG,
  type FlowStep,
  type FlowStepType,
} from "@/lib/agentguard/flow-types";

export function FlowBuilder({ initialName = "", initialDescription = "", flowId }: {
  initialName?: string;
  initialDescription?: string;
  flowId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName || "My agent flow");
  const [description, setDescription] = useState(initialDescription);
  const [steps, setSteps] = useState<FlowStep[]>(buildDefaultSteps());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleStep(id: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  function moveStep(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= steps.length) return;
    setSteps((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const url = flowId ? `/api/v1/flows/${flowId}` : "/api/v1/flows";
      const method = flowId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, steps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "save failed");
      const id = flowId || (data.id as string | undefined);
      router.push(id ? `/flows/${id}` : "/flows");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4 p-6">
        <label className="block text-sm font-medium text-text-primary">
          Flow name
          <input
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Description
          <textarea
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display text-lg text-text-primary">Pipeline steps</h3>
        <p className="mt-1 text-sm text-text-secondary">Enable, disable, and reorder steps in your agentic pipeline.</p>
        <ul className="mt-6 space-y-3">
          {steps.map((step, index) => {
            const meta = FLOW_STEP_CATALOG[step.type as FlowStepType];
            return (
              <li
                key={step.id}
                className={`flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center ${
                  step.enabled ? "bg-surface" : "bg-surface/50 opacity-70"
                }`}
              >
                <div className="flex flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={step.enabled}
                    onChange={() => toggleStep(step.id)}
                    className="mt-1 h-4 w-4 accent-accent"
                    aria-label={`Enable ${step.name}`}
                  />
                  <div>
                    <p className="font-medium text-text-primary">{meta?.name ?? step.name}</p>
                    <p className="text-xs text-text-muted">{meta?.description ?? step.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button type="button" className="btn-primary" disabled={saving || !name.trim()} onClick={save}>
        {saving ? "Saving…" : flowId ? "Update flow" : "Save flow"}
      </button>
    </div>
  );
}
