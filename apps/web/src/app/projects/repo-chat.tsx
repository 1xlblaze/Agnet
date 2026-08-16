"use client";

import { useEffect, useRef, useState, useTransition } from "react";

const SUGGESTIONS = [
  "Where does this repo lack?",
  "What security gaps exist?",
  "How can I improve reliability?",
  "What's good about the architecture?",
];

type Message = {
  role: "user" | "assistant";
  text: string;
  intent?: string;
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
        <p key={i} className="ml-4 mt-1 text-xs text-accent">
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

export function RepoChat({ repositoryId, repoName }: { repositoryId: string; repoName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function ask(question: string) {
    if (!question.trim() || pending) return;
    start(async () => {
      setErr("");
      setMessages((m) => [...m, { role: "user", text: question }]);
      setInput("");
      try {
        const res = await fetch(`/api/v1/repositories/${repositoryId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || `chat failed ${res.status}`);
        setMessages((m) => [...m, { role: "assistant", text: data.answer, intent: data.intent }]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "failed");
      }
    });
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="border-b border-border bg-surface-raised/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Repository assistant</p>
            <p className="text-xs text-text-muted">
              Ask about gaps, strengths, or fixes for <span className="text-text-secondary">{repoName}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            className="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent/40 hover:bg-accent/5 hover:text-text-primary disabled:opacity-50"
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="scrollbar-thin h-[28rem] space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl text-text-muted">
              ?
            </div>
            <p className="text-sm text-text-secondary">Ask a specific question to get targeted answers.</p>
            <p className="mt-1 text-xs text-text-muted">
              Different questions return different evidence — not a generic summary.
            </p>
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "rounded-br-md bg-accent text-canvas"
                  : "rounded-bl-md border border-border bg-surface-raised text-text-secondary"
              }`}
            >
              {m.role === "assistant" && m.intent ? (
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {m.intent.replace(/_/g, " ")}
                </p>
              ) : null}
              <div>{formatLines(m.text)}</div>
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface-raised px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent [animation-delay:0.4s]" />
                </span>
                Searching baseline evidence…
              </div>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-border bg-surface-raised/30 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="input flex-1"
          placeholder="e.g. What security issues exist?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !input.trim()} className="btn-primary shrink-0">
          Send
        </button>
      </form>
      {err ? <p className="px-4 pb-3 text-xs text-danger">{err}</p> : null}
    </div>
  );
}
