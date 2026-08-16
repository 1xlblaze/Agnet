"use client";

import { INTENT_SKILL_MAP, intentLabel } from "./agent-skills";

type GapSource = {
  dimension: string;
  check: string;
  detail: string;
  recommendation?: string;
  passed?: boolean;
};

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatLines(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("  → Fix:")) {
      return (
        <p key={i} className="ml-4 mt-1 rounded-lg bg-accent-secondary/5 px-2 py-1 text-xs text-accent-secondary dark:bg-accent/5 dark:text-accent">
          {renderText(line)}
        </p>
      );
    }
    if (line.startsWith("✗") || line.startsWith("✓")) {
      return (
        <p key={i} className="mt-2 text-sm leading-relaxed">
          {renderText(line)}
        </p>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-sm leading-relaxed">
        {renderText(line)}
      </p>
    );
  });
}

export function RagMessage({
  text,
  intent,
  sources,
  gaps,
}: {
  text: string;
  intent?: string;
  sources?: string[];
  gaps?: GapSource[];
}) {
  const skillId = intent ? INTENT_SKILL_MAP[intent] : undefined;
  const isRag = intent === "retrieval";

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[92%] space-y-3">
        <div className="flex items-start gap-3">
          <div className="agent-orb shrink-0 text-[10px] font-bold">AI</div>
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border bg-surface-raised px-4 py-3">
            {intent ? (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge-rag">{intentLabel(intent)}</span>
                {isRag ? <span className="text-[10px] text-text-muted">semantic retrieval</span> : null}
                {skillId ? (
                  <span className="text-[10px] text-text-muted">via {skillId.replace(/_/g, " ")}</span>
                ) : null}
              </div>
            ) : null}
            <div className="text-text-secondary">{formatLines(text)}</div>
          </div>
        </div>

        {sources && sources.length > 0 ? (
          <div className="ml-[52px] rounded-xl border border-border bg-surface p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Retrieved sources ({sources.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((src) => (
                <span key={src} className="source-chip">
                  <span className="text-accent">#</span>
                  {src.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {gaps && gaps.length > 0 ? (
          <div className="ml-[52px] space-y-2">
            {gaps.slice(0, 4).map((g) => (
              <div
                key={g.check}
                className={`rounded-xl border p-3 text-xs ${
                  g.passed
                    ? "border-accent-secondary/20 bg-accent-secondary/5"
                    : "border-danger/20 bg-danger/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={g.passed ? "text-accent-secondary" : "text-danger"}>
                    {g.passed ? "✓" : "✗"}
                  </span>
                  <span className="font-medium text-text-primary">{g.check.replace(/_/g, " ")}</span>
                  <span className="badge-neutral ml-auto">{g.dimension}</span>
                </div>
                <p className="mt-1 text-text-secondary">{g.detail}</p>
                {g.recommendation ? (
                  <p className="mt-2 text-accent-secondary dark:text-accent">→ {g.recommendation}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
