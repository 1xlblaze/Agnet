import { hasSupabaseAdmin } from "@/lib/supabase";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://iltfwvonkotfdvtrhejv.supabase.co";

export async function proxyEdge(path: string, init?: RequestInit) {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  }
  const target = `${SUPABASE_URL}/functions/v1/agentguard-api/api/v1/${path}`;
  const res = await fetch(target, { ...init, cache: "no-store" });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export function useEdgeApi() {
  return Boolean(SUPABASE_URL);
}

export function hasSupabaseUrl() {
  return Boolean(SUPABASE_URL) || hasSupabaseAdmin();
}
