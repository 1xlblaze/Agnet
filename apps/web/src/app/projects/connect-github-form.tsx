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
    <div className="glass-card overflow-hidden">
      <div className="border-b border-border bg-accent/5 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-text-primary">Connect a repository</p>
            <p className="text-sm text-text-secondary">Enter a public GitHub repo to scan and generate a baseline report.</p>
          </div>
        </div>
      </div>
      <form
        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:p-6"
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
          <label htmlFor="github-repo" className="mb-1.5 block text-xs font-medium text-text-muted">
            GitHub repository
          </label>
          <input
            id="github-repo"
            className="input"
            placeholder="owner/repo"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            disabled={pending}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
              Working…
            </span>
          ) : (
            "Connect & scan"
          )}
        </button>
      </form>
      {err ? <p className="px-5 pb-4 text-sm text-danger sm:px-6">{err}</p> : null}
      {msg ? <p className="px-5 pb-4 text-sm text-accent sm:px-6">{msg}</p> : null}
    </div>
  );
}
