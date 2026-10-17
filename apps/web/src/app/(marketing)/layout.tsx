import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="agent-orb text-[10px] font-bold">AG</div>
            <span className="font-display text-lg font-semibold text-text-primary">AgentGuard Studio</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#flows" className="hover:text-text-primary">Flows</a>
            <a href="#prd" className="hover:text-text-primary">PRD → Prod</a>
            <a href="#platform" className="hover:text-text-primary">Platform</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/dashboard" className="btn-ghost hidden sm:inline-flex">Dashboard</Link>
            <Link href="/flows/new" className="btn-primary">Start a flow</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-text-muted lg:px-8 sm:flex-row sm:items-center sm:justify-between">
          <p>AgentGuard — trust layer for autonomous software engineering.</p>
          <div className="flex gap-6">
            <Link href="/flows" className="hover:text-text-secondary">Flows</Link>
            <Link href="/projects" className="hover:text-text-secondary">Projects</Link>
            <Link href="/dashboard" className="hover:text-text-secondary">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
