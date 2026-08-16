"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ConnectGitHubForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [github, setGithub] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="flex flex-col gap-3 border border-foam/10 bg-ink/30 p-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr("");
          setMsg("");
          const ref = github.trim();
          if (!ref.includes("/")) {
            setErr("Enter owner/repo (e.g. facebook/react)");
            return;
          }
          try {
            const connectRes = await fetch("/api/v1/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ github: ref }),
            });
            if (!connectRes.ok) {
              const body = await connectRes.json().catch(() => ({}));
              throw new Error(body?.error?.message || `connect failed ${connectRes.status}`);
            }
            const data = await connectRes.json();
            const repoId = data.repository?.id;
            if (!repoId) throw new Error("repository not created");

            setMsg("Connected — running baseline scan…");
            const analyzeRes = await fetch(`/api/v1/repositories/${repoId}/analyze`, { method: "POST" });
            if (!analyzeRes.ok) {
              const body = await analyzeRes.json().catch(() => ({}));
              throw new Error(body?.error?.message || `baseline failed ${analyzeRes.status}`);
            }
            setGithub("");
            setMsg(`Baseline complete for ${ref}`);
            router.refresh();
          } catch (e) {
            setErr(e instanceof Error ? e.message : "failed");
          }
        });
      }}
    >
      <div className="flex-1">
        <label className="text-xs uppercase tracking-wider text-sand/70">Connect GitHub repository</label>
        <input
          className="mt-1 w-full border border-foam/15 bg-ink/50 px-3 py-2 text-sm text-foam placeholder:text-sand/40"
          placeholder="owner/repo"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          disabled={pending}
        />
      </div>
      <button
        type="submit"
        className="bg-moss px-4 py-2 text-sm font-semibold text-foam transition hover:brightness-110 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Working…" : "Connect & scan"}
      </button>
      {err ? <p className="w-full text-xs text-ember">{err}</p> : null}
      {msg ? <p className="w-full text-xs text-moss">{msg}</p> : null}
    </form>
  );
}
