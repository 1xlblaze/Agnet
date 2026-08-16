const stages = [
  { key: "graph", label: "Graph", color: "#9fbbe0" },
  { key: "blast", label: "Blast", color: "#dfa88f" },
  { key: "rag", label: "RAG", color: "#9fc9a2" },
  { key: "llm", label: "LLM", color: "#c0a8dd" },
  { key: "verify", label: "Verify", color: "#c08532" },
  { key: "deploy", label: "Deploy", color: "#1f8a65" },
] as const;

export function PipelineTimeline({ activeIndex = 4 }: { activeIndex?: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <li
          key={s.key}
          className="flex items-center gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2 text-sm"
          style={{ opacity: i <= activeIndex ? 1 : 0.45 }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="font-medium text-ink">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
