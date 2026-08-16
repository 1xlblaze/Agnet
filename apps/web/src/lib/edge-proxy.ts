import { hasDatabase, hasSupabaseAdmin } from "@/lib/supabase";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function proxyEdge(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const target = `${SUPABASE_URL}/functions/v1/agentguard-api/api/v1/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${SERVICE_KEY}`);
  headers.set("apikey", SERVICE_KEY);
  const res = await fetch(target, { ...init, headers, cache: "no-store" });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export function useEdgeApi() {
  return !hasDatabase() && hasSupabaseAdmin();
}
