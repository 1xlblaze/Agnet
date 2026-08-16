"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV = [
  { href: "/", label: "Dashboard", short: "Home" },
  { href: "/projects", label: "Projects", short: "Projects" },
  { href: "/pull-requests", label: "Pull Requests", short: "PRs" },
  { href: "/deployments", label: "Deployments", short: "Deploy" },
];

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = active ? "text-accent" : "text-text-muted";
  const icons: Record<string, React.ReactNode> = {
    "/": (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    "/projects": (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    "/pull-requests": (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M6 9v3a3 3 0 0 0 3 3h6" />
      </svg>
    ),
    "/deployments": (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  };
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-accent/10" : "bg-surface-overlay"}`}>
      {icons[name]}
    </span>
  );
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20"
          : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
      }`}
    >
      <NavIcon name={href} active={active} />
      {label}
    </Link>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
              active ? "text-accent" : "text-text-muted"
            }`}
          >
            <NavIcon name={item.href} active={active} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/95 backdrop-blur-xl lg:flex">
        <div className="border-b border-border px-5 py-6">
          <Link href="/" className="group block">
            <div className="flex items-center gap-3">
              <div className="agent-orb text-[10px] font-bold">AG</div>
              <div>
                <p className="font-display text-lg font-semibold text-text-primary">AgentGuard</p>
                <p className="text-[11px] text-text-muted">RAG-powered control plane</p>
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-4">
          <ThemeToggle />
          <Link href="/projects" className="btn-primary w-full text-center">
            Connect repository
          </Link>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="agent-orb h-8 w-8 text-[9px]">AG</div>
          <span className="font-display text-lg font-semibold">AgentGuard</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button type="button" className="btn-ghost px-3 py-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface p-4 pt-16 shadow-2xl">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} onClick={() => setOpen(false)} />
              ))}
            </nav>
            <div className="mt-4">
              <ThemeToggle />
            </div>
            <Link href="/projects" className="btn-primary mt-4 w-full text-center" onClick={() => setOpen(false)}>
              Connect repository
            </Link>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-16 lg:px-8 lg:pb-10 lg:pt-10">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
