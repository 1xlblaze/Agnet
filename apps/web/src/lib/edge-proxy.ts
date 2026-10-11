import { hasDatabase, hasSupabaseAdmin } from "@/lib/supabase";

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export async function proxyEdge(path: string, init?: RequestInit) {
  const base = supabaseUrl();
  if (!base) {
    throw new Error(
      "Supabase edge API is not configured. Set SUPABASE_URL or use DATABASE_URL with AGENTGUARD_USE_EDGE_API=false.",
    );
  }
  const target = `${base.replace(/\/$/, "")}/functions/v1/agentguard-api/api/v1/${path}`;
  try {
    const res = await fetch(target, { ...init, cache: "no-store" });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Supabase edge API unreachable (${target}): ${detail}. Restore the Supabase project or set AGENTGUARD_USE_EDGE_API=false with DATABASE_URL.`,
    );
  }
}

/** Route API traffic through Supabase Edge Functions only when explicitly enabled or when no direct DB is configured. */
export function useEdgeApi() {
  if (process.env.AGENTGUARD_USE_EDGE_API === "true") return true;
  if (process.env.AGENTGUARD_USE_EDGE_API === "false") return false;
  if (hasDatabase()) return false;
  return Boolean(supabaseUrl());
}

export function hasSupabaseUrl() {
  return Boolean(supabaseUrl()) || hasSupabaseAdmin();
}
