"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CreateProjectButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  return (
    <div>
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-active disabled:opacity-60"
        disabled={pending}
        onClick={() => {
          start(async () => {
            setErr("");
            try {
              const api = process.env.NEXT_PUBLIC_API_URL || "";
              const res = await fetch(`${api}/api/v1/projects/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `svc-${Date.now().toString().slice(-4)}` }),
              });
              if (!res.ok) throw new Error(`create failed ${res.status}`);
              router.refresh();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "failed");
            }
          });
        }}
      >
        {pending ? "Creating…" : "Create Project"}
      </button>
      {err ? <p className="mt-2 text-xs text-danger">{err}</p> : null}
    </div>
  );
}
