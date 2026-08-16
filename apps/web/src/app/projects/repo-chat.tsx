"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { INTENT_SKILL_MAP } from "@/components/agent/agent-skills";
import { AgentThinking } from "@/components/agent/agent-thinking";
import { RagMessage } from "@/components/agent/rag-message";
import { RagSkillsPanel } from "@/components/agent/rag-skills-panel";

const SUGGESTIONS = [
  "What's this repo about?",
  "Where does this repo lack?",
  "What security gaps exist?",
  "How can I improve reliability?",
];

type GapSource = {
  dimension: string;
  check: string;
  detail: string;
  recommendation?: string;
  passed?: boolean;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  intent?: string;
  sources?: string[];
  gaps?: GapSource[];
};

export function RepoChat({ repositoryId, repoName }: { repositoryId: string; repoName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const [activeSkill, setActiveSkill] = useState<string | undefined>();
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
        const intent = data.intent as string | undefined;
        setActiveSkill(intent ? INTENT_SKILL_MAP[intent] : undefined);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data.answer,
            intent,
            sources: data.sources,
            gaps: data.gaps,
          },
        ]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "failed");
      }
    });
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="border-b border-border bg-agent-gradient px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-sm font-bold backdrop-blur-sm">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold">Repository agent</p>
            <p className="text-xs text-white/80">
              RAG assistant for <span className="font-medium">{repoName}</span>
            </p>
          </div>
        </div>
      </div>

      <RagSkillsPanel activeSkill={activeSkill} />

      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent disabled:opacity-50"
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="scrollbar-thin h-[32rem] space-y-5 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="agent-orb mb-4 text-sm font-bold">AI</div>
            <p className="text-sm font-medium text-text-primary">Ask anything about this repository</p>
            <p className="mt-2 max-w-xs text-xs text-text-muted">
              Answers are grounded in baseline scan evidence via semantic RAG — each question retrieves different
              sources.
            </p>
          </div>
        ) : null}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-sm text-white dark:text-canvas">
                {m.text}
              </div>
            </div>
          ) : (
            <RagMessage key={i} text={m.text} intent={m.intent} sources={m.sources} gaps={m.gaps} />
          ),
        )}
        {pending ? <AgentThinking /> : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-border bg-surface-overlay/30 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="input flex-1"
          placeholder="Ask about gaps, security, architecture…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !input.trim()} className="btn-primary shrink-0">
          {pending ? "…" : "Ask"}
        </button>
      </form>
      {err ? <p className="px-4 pb-3 text-xs text-danger">{err}</p> : null}
    </div>
  );
}
