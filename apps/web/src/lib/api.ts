function apiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { proxyEdge, useEdgeApi } = await import("@/lib/edge-proxy");
  if (useEdgeApi()) {
    const edgePath = path.replace(/^\/api\/v1\//, "");
    const res = await proxyEdge(edgePath, init);
    if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
  const res = await fetch(`${apiBaseUrl()}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  if (typeof window === "undefined") return serverFetch<T>(path);
  const res = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  };
  if (typeof window === "undefined") return serverFetch<T>(path, init);
  const res = await fetch(`${apiBaseUrl()}${path}`, init);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
