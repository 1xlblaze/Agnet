"use client";

import { useEffect, useRef, useState, useTransition } from "react";

const SUGGESTIONS = [
  "Where does this repo lack?",
  "What security gaps exist?",
  "How can I improve?",
  "What's good about reliability?",
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
        <strong key={i} className="font-semibold text-foam">
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
        <p key={i} className="ml-4 mt-1 text-xs text-moss/90">
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
    <div className="card overflow-hidden">
      <div className="border-b border-foam/10 bg-ink/40 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-moss">Repository assistant</p>
        <p className="mt-1 text-sm text-sand/80">
          Ask about gaps, strengths, or fixes for <span className="text-foam">{repoName}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-foam/10 px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            className="rounded-full border border-foam/15 bg-ink/30 px-3 py-1.5 text-xs text-sand/85 transition hover:border-moss/50 hover:bg-moss/10 hover:text-foam disabled:opacity-50"
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="h-80 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-sand/60">Ask a specific question to get targeted answers.</p>
            <p className="mt-1 text-xs text-sand/45">Different questions return different evidence — not a generic summary.</p>
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "rounded-br-md bg-moss text-foam"
                  : "rounded-bl-md border border-foam/10 bg-ink/50 text-sand/90"
              }`}
            >
              {m.role === "assistant" && m.intent ? (
                <p className="mb-2 text-[10px] uppercase tracking-wider text-sand/45">{m.intent.replace(/_/g, " ")}</p>
              ) : null}
              <div>{formatLines(m.text)}</div>
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-foam/10 bg-ink/50 px-4 py-3">
              <p className="text-sm text-sand/50">Searching baseline evidence…</p>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-foam/10 bg-ink/20 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="flex-1 rounded-lg border border-foam/15 bg-ink/60 px-4 py-2.5 text-sm text-foam placeholder:text-sand/40 focus:border-moss/50 focus:outline-none"
          placeholder="e.g. What security issues exist?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-lg bg-moss px-5 py-2.5 text-sm font-semibold text-foam transition hover:brightness-110 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {err ? <p className="px-4 pb-3 text-xs text-ember">{err}</p> : null}
    </div>
  );
}
