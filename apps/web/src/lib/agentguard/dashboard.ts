import { proxyEdge, useEdgeApi } from "@/lib/edge-proxy";
import { dashboardReports } from "@/lib/agentguard/reports";
import { hasDatabase, hasSupabaseAdmin } from "@/lib/supabase";

export type RepoReport = {
  id: string;
  full_name: string;
  github_url?: string;
  project_id: string;
  status: string;
  production_confidence: number;
  report?: {
    production_confidence?: number;
    scores?: {
      security?: number;
      reliability?: number;
      performance?: number;
      architecture?: number;
      database?: number;
    };
  } | null;
};

export type DashboardData = {
  items?: RepoReport[];
  repositories_with_reports?: RepoReport[];
};

export async function loadDashboard(): Promise<DashboardData> {
  if (useEdgeApi()) {
    const res = await proxyEdge("dashboard");
    return res.json() as Promise<DashboardData>;
  }
  if (hasSupabaseAdmin()) return dashboardReports();
  if (hasDatabase()) return { items: [], repositories_with_reports: [] };
  throw new Error("Supabase or database configuration is required");
}
