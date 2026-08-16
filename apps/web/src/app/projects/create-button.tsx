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
        className="btn-primary"
        disabled={pending}
        onClick={() => {
          start(async () => {
            setErr("");
            try {
              const res = await fetch("/api/v1/projects/generate", {
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
        {pending ? "Creating…" : "Demo project"}
      </button>
      {err ? <p className="mt-2 text-xs text-ember">{err}</p> : null}
    </div>
  );
}
