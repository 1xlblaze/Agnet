"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: "parse", label: "Understanding query" },
  { id: "retrieve", label: "Retrieving evidence" },
  { id: "rank", label: "Ranking chunks" },
  { id: "synthesize", label: "Synthesizing answer" },
];

export function AgentThinking() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-md rounded-2xl rounded-bl-md border border-border bg-surface-raised p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="agent-orb animate-agent-pulse text-sm">AI</div>
          <div>
            <p className="text-sm font-medium text-text-primary">Agent is thinking</p>
            <p className="text-xs text-text-muted">Running RAG pipeline on baseline report</p>
          </div>
        </div>
        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={i < step ? "rag-step-done" : i === step ? "rag-step-active" : "rag-step"}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                {i < step ? "✓" : i === step ? "●" : "○"}
              </span>
              {s.label}
              {i === step ? (
                <span className="ml-auto h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
