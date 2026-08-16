export const AGENT_SKILLS = [
  {
    id: "rag",
    label: "Semantic RAG",
    description: "Retrieves baseline evidence chunks matched to your question",
    icon: "◎",
  },
  {
    id: "gaps",
    label: "Gap analysis",
    description: "Surfaces failed checks grouped by production dimension",
    icon: "△",
  },
  {
    id: "dimensions",
    label: "Dimension scoring",
    description: "Security, reliability, performance, architecture, database",
    icon: "◈",
  },
  {
    id: "fixes",
    label: "Fix recommendations",
    description: "Actionable remediation steps per finding",
    icon: "→",
  },
  {
    id: "strengths",
    label: "Strength detection",
    description: "Highlights passed checks and positive signals",
    icon: "✓",
  },
] as const;

export const INTENT_SKILL_MAP: Record<string, string> = {
  retrieval: "rag",
  all_gaps: "gaps",
  all_clear: "gaps",
  fix_top: "fixes",
  fix_none: "fixes",
  strengths: "strengths",
  summary: "dimensions",
  repo_about: "dimensions",
  security_gaps: "gaps",
  security_strengths: "strengths",
  security_clear: "dimensions",
  reliability_gaps: "gaps",
  reliability_strengths: "strengths",
  reliability_clear: "dimensions",
  performance_gaps: "gaps",
  performance_strengths: "strengths",
  performance_clear: "dimensions",
  architecture_gaps: "gaps",
  architecture_strengths: "strengths",
  architecture_clear: "dimensions",
  database_gaps: "gaps",
  database_strengths: "strengths",
  database_clear: "dimensions",
};

export function intentLabel(intent: string): string {
  return intent.replace(/_/g, " ");
}
