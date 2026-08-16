"use client";

import { useState, useTransition } from "react";

const SUGGESTIONS = [
  "Where does this repo lack?",
  "What security gaps exist?",
  "Are there missing tests?",
  "What database issues were found?",
];

export function RepoChat({ repositoryId }: { repositoryId: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function ask(question: string) {
    if (!question.trim()) return;
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
        setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "failed");
      }
    });
  }

  return (
    <div className="border border-foam/10 bg-ink/30">
      <div className="border-b border-foam/10 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-sand/65">RAG assistant</p>
        <p className="mt-1 text-sm text-sand/80">Ask where this repository lacks based on its baseline scan evidence.</p>
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            className="border border-foam/15 px-2.5 py-1 text-xs text-sand/80 transition hover:border-moss/40 hover:text-moss disabled:opacity-50"
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <p className="text-sm text-sand/50">No messages yet. Pick a suggestion or type a question.</p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded px-3 py-2 text-sm ${m.role === "user" ? "ml-8 bg-moss/15 text-foam" : "mr-8 bg-ink/50 text-sand/90"}`}
          >
            <p className="mb-1 text-[10px] uppercase tracking-wider text-sand/50">{m.role}</p>
            <div className="whitespace-pre-wrap leading-relaxed">{m.text.replace(/\*\*/g, "")}</div>
          </div>
        ))}
        {pending ? <p className="text-xs text-sand/50">Analyzing baseline evidence…</p> : null}
      </div>

      <form
        className="flex gap-2 border-t border-foam/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="flex-1 border border-foam/15 bg-ink/50 px-3 py-2 text-sm text-foam placeholder:text-sand/40"
          placeholder="Ask about gaps, security, tests…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="bg-moss px-4 py-2 text-sm font-semibold text-foam disabled:opacity-50"
        >
          Ask
        </button>
      </form>
      {err ? <p className="px-4 pb-3 text-xs text-ember">{err}</p> : null}
    </div>
  );
}
