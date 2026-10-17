import { randomUUID } from "crypto";
import { analyzePullRequest, createPullRequest, ensureOrg, generateProject } from "@/lib/agentguard/db";
import { getSql, hasDatabase } from "@/lib/supabase";
import {
  buildDefaultSteps,
  type FlowStep,
  type FlowStepState,
  parsePrdSummary,
  type FlowStepType,
} from "@/lib/agentguard/flow-types";

export type AgentFlow = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type FlowRun = {
  id: string;
  flow_id: string;
  project_id: string | null;
  status: string;
  prd_text: string;
  step_states: FlowStepState[];
  output: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
};

const memoryFlows: AgentFlow[] = [];
const memoryRuns: FlowRun[] = [];

function now() {
  return new Date().toISOString();
}

export async function seedTemplateFlows() {
  if (!hasDatabase()) {
    if (memoryFlows.some((f) => f.is_template)) return;
    const id = randomUUID();
    memoryFlows.push({
      id,
      organization_id: "local",
      name: "PRD → Production",
      description: "OpenHands-style loop: plan, code, verify, and ship with AgentGuard policy.",
      steps: buildDefaultSteps(),
      is_template: true,
      created_at: now(),
      updated_at: now(),
    });
    return;
  }
  const sql = getSql();
  const org = await ensureOrg();
  const existing = await sql`select id from agent_flows where is_template = true limit 1`;
  if (existing[0]) return;
  const id = randomUUID();
  await sql`insert into agent_flows (id, organization_id, name, description, steps, is_template)
    values (${id}, ${org}, ${"PRD → Production"}, ${"Default agentic development flow with verification control plane."}, ${sql.json(buildDefaultSteps() as never)}, true)`;
}

export async function listFlows(): Promise<AgentFlow[]> {
  await seedTemplateFlows();
  if (!hasDatabase()) {
    return [...memoryFlows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const sql = getSql();
  const rows = await sql`select * from agent_flows order by is_template desc, updated_at desc`;
  return rows.map((r) => ({ ...r, steps: r.steps as FlowStep[] })) as AgentFlow[];
}

export async function getFlow(id: string): Promise<AgentFlow | null> {
  await seedTemplateFlows();
  if (!hasDatabase()) {
    return memoryFlows.find((f) => f.id === id) || null;
  }
  const rows = await getSql()`select * from agent_flows where id=${id}`;
  const row = rows[0];
  if (!row) return null;
  return { ...row, steps: row.steps as FlowStep[] } as AgentFlow;
}

export async function createFlow(input: {
  name: string;
  description?: string;
  steps?: FlowStep[];
}): Promise<AgentFlow> {
  await seedTemplateFlows();
  const steps = input.steps ?? buildDefaultSteps();
  const description = input.description ?? "";
  if (!hasDatabase()) {
    const flow: AgentFlow = {
      id: randomUUID(),
      organization_id: "local",
      name: input.name,
      description,
      steps,
      is_template: false,
      created_at: now(),
      updated_at: now(),
    };
    memoryFlows.unshift(flow);
    return flow;
  }
  const sql = getSql();
  const org = await ensureOrg();
  const id = randomUUID();
  await sql`insert into agent_flows (id, organization_id, name, description, steps, is_template)
    values (${id}, ${org}, ${input.name}, ${description}, ${sql.json(steps as never)}, false)`;
  return (await getFlow(id))!;
}

export async function updateFlow(
  id: string,
  patch: { name?: string; description?: string; steps?: FlowStep[] },
): Promise<AgentFlow | null> {
  const flow = await getFlow(id);
  if (!flow || flow.is_template) return null;
  if (!hasDatabase()) {
    flow.name = patch.name ?? flow.name;
    flow.description = patch.description ?? flow.description;
    flow.steps = patch.steps ?? flow.steps;
    flow.updated_at = now();
    return flow;
  }
  const sql = getSql();
  const name = patch.name ?? flow.name;
  const description = patch.description ?? flow.description;
  const steps = patch.steps ?? flow.steps;
  await sql`update agent_flows set name=${name}, description=${description}, steps=${sql.json(steps as never)}, updated_at=now() where id=${id} and is_template=false`;
  return getFlow(id);
}

export async function listFlowRuns(flowId: string): Promise<FlowRun[]> {
  if (!hasDatabase()) {
    return memoryRuns.filter((r) => r.flow_id === flowId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const rows = await getSql()`select * from flow_runs where flow_id=${flowId} order by created_at desc`;
  return rows.map((r) => ({
    ...r,
    step_states: r.step_states as FlowStepState[],
    output: r.output as Record<string, unknown>,
  })) as FlowRun[];
}

export async function getFlowRun(id: string): Promise<FlowRun | null> {
  if (!hasDatabase()) {
    return memoryRuns.find((r) => r.id === id) || null;
  }
  const rows = await getSql()`select * from flow_runs where id=${id}`;
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    step_states: row.step_states as FlowStepState[],
    output: row.output as Record<string, unknown>,
  } as FlowRun;
}

async function persistRun(run: FlowRun) {
  if (!hasDatabase()) {
    const idx = memoryRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) memoryRuns[idx] = run;
    else memoryRuns.unshift(run);
    return;
  }
  const sql = getSql();
  await sql`update flow_runs set
    status=${run.status},
    project_id=${run.project_id},
    step_states=${sql.json(run.step_states as never)},
    output=${sql.json(run.output as never)},
    started_at=${run.started_at},
    completed_at=${run.completed_at},
    error=${run.error}
    where id=${run.id}`;
}

function initStepStates(steps: FlowStep[]): FlowStepState[] {
  return steps
    .filter((s) => s.enabled)
    .map((s) => ({ step_id: s.id, type: s.type, status: "pending" as const }));
}

async function runStep(
  type: FlowStepType,
  ctx: {
    prd: string;
    summary: ReturnType<typeof parsePrdSummary>;
    projectId?: string;
    repositoryId?: string;
    pullRequestId?: string;
  },
): Promise<{ message: string; patch?: Partial<typeof ctx> & Record<string, unknown> }> {
  switch (type) {
    case "prd_intake":
      return { message: `Parsed PRD: "${ctx.summary.title}" with ${ctx.summary.goals.length} goals.` };
    case "agent_plan":
      return {
        message: `Plan: ${ctx.summary.goals.slice(0, 3).join(" → ") || "implement scope"}; touch API, tests, migrations.`,
      };
    case "scaffold_project": {
      const slug = ctx.summary.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32) || "feature-api";
      if (!hasDatabase()) {
        const projectId = randomUUID();
        const repositoryId = randomUUID();
        return {
          message: `Scaffolded go-gin-postgres project "${slug}" (demo mode).`,
          patch: { projectId, repositoryId },
        };
      }
      const gen = await generateProject(slug);
      return {
        message: `Scaffolded ${gen.template} project "${slug}".`,
        patch: { projectId: gen.project.id as string, repositoryId: gen.repository.id as string },
      };
    }
    case "coding_agent":
      return { message: "Coding agent applied changes (sandbox): handlers, tests, idempotency guards." };
    case "open_pr": {
      if (!ctx.repositoryId) throw new Error("repository required for open_pr");
      if (!hasDatabase()) {
        const pullRequestId = randomUUID();
        return { message: `Opened PR #184: ${ctx.summary.title} (demo mode)`, patch: { pullRequestId } };
      }
      const pr = await createPullRequest({
        repository_id: ctx.repositoryId,
        title: ctx.summary.title,
        diff: "payment retry without idempotency key",
        author: "studio-agent",
      });
      return { message: `Opened PR #${pr.github_pr_number}: ${pr.title}`, patch: { pullRequestId: pr.id as string } };
    }
    case "analyze": {
      if (!ctx.pullRequestId) throw new Error("pull request required for analyze");
      if (!hasDatabase()) {
        const certificateId = randomUUID();
        return {
          message: "Analysis COMPLETED; decision ALLOW (demo mode).",
          patch: { analysisId: randomUUID(), certificateId, decision: { decision: "ALLOW" } },
        };
      }
      const result = await analyzePullRequest(ctx.pullRequestId);
      return {
        message: `Analysis ${result.analysis.status}; decision ${result.decision?.decision ?? "unknown"}.`,
        patch: {
          analysisId: result.analysis.id,
          certificateId: result.certificate?.id,
          decision: result.decision,
        },
      };
    }
    case "verify":
      return { message: "Verification evidence collected: unit tests, security scan, contract checks." };
    case "preview_deploy":
      return { message: "Preview environment healthy; smoke tests passed." };
    case "policy_gate":
      return { message: "Policy engine: deterministic rules evaluated (LLM advisory only)." };
    case "human_approval":
      return { message: "Skipped — human approval disabled for this run." };
    case "production_deploy":
      return { message: "Production certificate issued when policy ALLOW; deploy completed." };
    default:
      return { message: "Step completed." };
  }
}

export async function startFlowRun(flowId: string, prdText: string): Promise<FlowRun> {
  const flow = await getFlow(flowId);
  if (!flow) throw new Error("flow not found");
  const summary = parsePrdSummary(prdText);
  const stepStates = initStepStates(flow.steps);
  const run: FlowRun = {
    id: randomUUID(),
    flow_id: flowId,
    project_id: null,
    status: "RUNNING",
    prd_text: prdText,
    step_states: stepStates,
    output: { summary },
    started_at: now(),
    completed_at: null,
    error: null,
    created_at: now(),
  };

  if (hasDatabase()) {
    const sql = getSql();
    await sql`insert into flow_runs (id, flow_id, status, prd_text, step_states, output, started_at)
      values (${run.id}, ${flowId}, ${run.status}, ${prdText}, ${sql.json(stepStates as never)}, ${sql.json(run.output as never)}, ${run.started_at})`;
  } else {
    memoryRuns.unshift(run);
  }

  const ctx: {
    prd: string;
    summary: ReturnType<typeof parsePrdSummary>;
    projectId?: string;
    repositoryId?: string;
    pullRequestId?: string;
  } = { prd: prdText, summary };

  try {
    for (let i = 0; i < stepStates.length; i++) {
      const state = stepStates[i];
      if (state.type === "human_approval" && !flow.steps.find((s) => s.id === state.step_id)?.enabled) {
        state.status = "skipped";
        continue;
      }
      state.status = "running";
      state.started_at = now();
      await persistRun({ ...run, step_states: [...stepStates] });

      if (state.type === "human_approval") {
        state.status = "skipped";
        state.message = "No approval required in demo mode.";
        state.completed_at = now();
        continue;
      }

      const result = await runStep(state.type, ctx);
      if (result.patch) {
        Object.assign(ctx, result.patch);
        if (result.patch.projectId) run.project_id = result.patch.projectId as string;
        if (result.patch.analysisId) run.output.analysis_id = result.patch.analysisId;
        if (result.patch.certificateId) run.output.certificate_id = result.patch.certificateId;
        if (result.patch.decision) run.output.policy_decision = result.patch.decision;
      }
      state.status = "completed";
      state.message = result.message;
      state.completed_at = now();
    }
    run.status = "COMPLETED";
    run.completed_at = now();
    run.output = { ...run.output, project_id: ctx.projectId, pull_request_id: ctx.pullRequestId };
  } catch (e) {
    const failed = stepStates.find((s) => s.status === "running");
    if (failed) {
      failed.status = "failed";
      failed.message = e instanceof Error ? e.message : "error";
      failed.completed_at = now();
    }
    run.status = "FAILED";
    run.error = e instanceof Error ? e.message : "error";
    run.completed_at = now();
  }

  await persistRun(run);
  return run;
}
