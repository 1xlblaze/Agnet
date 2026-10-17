export type FlowStepType =
  | "prd_intake"
  | "agent_plan"
  | "scaffold_project"
  | "coding_agent"
  | "open_pr"
  | "analyze"
  | "verify"
  | "preview_deploy"
  | "policy_gate"
  | "production_deploy"
  | "human_approval";

export type FlowStep = {
  id: string;
  type: FlowStepType;
  name: string;
  description: string;
  enabled: boolean;
};

export type FlowStepState = {
  step_id: string;
  type: FlowStepType;
  status: "pending" | "running" | "completed" | "skipped" | "failed";
  message?: string;
  started_at?: string;
  completed_at?: string;
};

export const FLOW_STEP_CATALOG: Record<
  FlowStepType,
  { name: string; description: string; defaultEnabled: boolean }
> = {
  prd_intake: {
    name: "PRD intake",
    description: "Parse goals, constraints, and acceptance criteria from the product brief.",
    defaultEnabled: true,
  },
  agent_plan: {
    name: "Agent planning",
    description: "Break the PRD into implementation tasks and repo touchpoints.",
    defaultEnabled: true,
  },
  scaffold_project: {
    name: "Scaffold project",
    description: "Create or attach a repository from a production-ready template.",
    defaultEnabled: true,
  },
  coding_agent: {
    name: "Coding agent",
    description: "Implement features in a sandboxed agent session (Codex / OpenHands-style).",
    defaultEnabled: true,
  },
  open_pr: {
    name: "Open pull request",
    description: "Push changes and open a PR for verification.",
    defaultEnabled: true,
  },
  analyze: {
    name: "AgentGuard analyze",
    description: "Architecture graph, blast radius, and structured risk findings.",
    defaultEnabled: true,
  },
  verify: {
    name: "Verification",
    description: "Run tests, security checks, and collect evidence.",
    defaultEnabled: true,
  },
  preview_deploy: {
    name: "Preview deploy",
    description: "Ephemeral preview environment and smoke tests.",
    defaultEnabled: true,
  },
  policy_gate: {
    name: "Policy gate",
    description: "Deterministic ALLOW / BLOCK / HUMAN_APPROVAL decision.",
    defaultEnabled: true,
  },
  production_deploy: {
    name: "Production deploy",
    description: "Issue certificate and deploy when policy allows.",
    defaultEnabled: true,
  },
  human_approval: {
    name: "Human approval",
    description: "Pause for reviewer sign-off before production.",
    defaultEnabled: false,
  },
};

export const DEFAULT_PRD_TO_PROD_STEP_ORDER: FlowStepType[] = [
  "prd_intake",
  "agent_plan",
  "scaffold_project",
  "coding_agent",
  "open_pr",
  "analyze",
  "verify",
  "preview_deploy",
  "policy_gate",
  "human_approval",
  "production_deploy",
];

export function buildDefaultSteps(overrides?: Partial<Record<FlowStepType, boolean>>): FlowStep[] {
  return DEFAULT_PRD_TO_PROD_STEP_ORDER.map((type, i) => {
    const meta = FLOW_STEP_CATALOG[type];
    const enabled = overrides?.[type] ?? meta.defaultEnabled;
    return {
      id: `step-${i + 1}-${type}`,
      type,
      name: meta.name,
      description: meta.description,
      enabled,
    };
  });
}

export function parsePrdSummary(prd: string): {
  title: string;
  goals: string[];
  acceptance: string[];
} {
  const lines = prd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title =
    lines.find((l) => /^#\s+/.test(l))?.replace(/^#+\s*/, "") ||
    lines[0]?.slice(0, 80) ||
    "Untitled feature";
  const goals = lines.filter((l) => /^[-*]\s+/.test(l) && !/accept/i.test(l)).map((l) => l.replace(/^[-*]\s+/, ""));
  const acceptance = lines
    .filter((l) => /acceptance|must|shall|criteria/i.test(l) || /^ac[:]/i.test(l))
    .map((l) => l.replace(/^[-*]\s+/, ""));
  return {
    title,
    goals: goals.length ? goals.slice(0, 8) : ["Implement PRD scope with tests"],
    acceptance: acceptance.length ? acceptance.slice(0, 6) : ["All verification checks pass", "Policy allows deploy"],
  };
}
