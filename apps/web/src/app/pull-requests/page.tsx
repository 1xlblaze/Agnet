import { apiGet } from "@/lib/api";

type PR = { id: string; title: string; github_pr_number: number; author: string; status: string; head_sha: string };

export default async function PullRequestsPage() {
  const res = await apiGet<{ items: PR[] }>("/api/v1/pull-requests").catch(() => ({ items: [] as PR[] }));
  const items = res.items || [];
  return (
    <section>
      <h1 className="font-display text-4xl text-foam">Pull Requests</h1>
      <ul className="mt-8 space-y-3">
        {items.map((pr) => (
          <li key={pr.id} className="border border-foam/10 bg-ink/30 px-4 py-3">
            <a href={`/pull-requests/${pr.id}`} className="font-display text-xl">#{pr.github_pr_number} {pr.title}</a>
            <p className="text-sm text-sand/80">{pr.author} · {pr.head_sha} · {pr.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
