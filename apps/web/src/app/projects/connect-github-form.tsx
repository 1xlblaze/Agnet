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
    <div className="card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-moss">Connect repository</p>
      <p className="mt-1 text-sm text-sand/75">Enter a public GitHub repo to scan and generate a baseline report.</p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
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
              setMsg(`Done! Opening ${ref}…`);
              router.push(`/projects/${data.project?.id || data.project_id}`);
            } catch (e) {
              setErr(e instanceof Error ? e.message : "failed");
            }
          });
        }}
      >
        <div className="flex-1">
          <label className="sr-only">GitHub repository</label>
          <input
            className="w-full rounded-lg border border-foam/15 bg-ink/50 px-4 py-2.5 text-sm text-foam placeholder:text-sand/40 focus:border-moss/50 focus:outline-none"
            placeholder="owner/repo"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            disabled={pending}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={pending}>
          {pending ? "Working…" : "Connect & scan"}
        </button>
      </form>
      {err ? <p className="mt-3 text-sm text-ember">{err}</p> : null}
      {msg ? <p className="mt-3 text-sm text-moss">{msg}</p> : null}
    </div>
  );
}
