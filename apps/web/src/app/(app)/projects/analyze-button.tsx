"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AnalyzeButton({ repositoryId, label = "Run baseline scan" }: { repositoryId: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  return (
    <div>
      <button
        className="btn-secondary text-xs"
        disabled={pending}
        type="button"
        onClick={() => {
          start(async () => {
            setErr("");
            try {
              const res = await fetch(`/api/v1/repositories/${repositoryId}/analyze`, { method: "POST" });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error?.message || `analyze failed ${res.status}`);
              }
              router.refresh();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "failed");
            }
          });
        }}
      >
        {pending ? "Scanning…" : label}
      </button>
      {err ? <p className="mt-1 text-xs text-ember">{err}</p> : null}
    </div>
  );
}
