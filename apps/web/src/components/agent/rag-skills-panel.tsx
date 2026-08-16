"use client";

import { AGENT_SKILLS } from "./agent-skills";

export function RagSkillsPanel({ activeSkill }: { activeSkill?: string }) {
  return (
    <div className="border-b border-border bg-surface-overlay/50 px-4 py-3 sm:px-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Agent skills</p>
        <span className="badge-rag">RAG-powered</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {AGENT_SKILLS.map((skill) => (
          <div
            key={skill.id}
            className={activeSkill === skill.id ? "skill-chip-active shrink-0" : "skill-chip shrink-0"}
            title={skill.description}
          >
            <span aria-hidden>{skill.icon}</span>
            {skill.label}
          </div>
        ))}
      </div>
    </div>
  );
}
