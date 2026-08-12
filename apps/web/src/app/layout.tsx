import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGuard",
  description: "Production control plane for AI coding agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="min-h-screen">
          <header className="mx-auto flex max-w-6xl items-end justify-between px-6 pb-4 pt-8">
            <div>
              <p className="font-display text-4xl font-bold tracking-tight text-foam md:text-5xl">AgentGuard</p>
              <p className="mt-2 max-w-xl text-sm text-sand/90 md:text-base">
                Verify AI-generated changes before they reach production.
              </p>
            </div>
            <nav className="flex gap-4 text-sm text-foam/80">
              <a href="/">Dashboard</a>
              <a href="/projects">Projects</a>
              <a href="/pull-requests">Pull Requests</a>
              <a href="/deployments">Deployments</a>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 pb-16 pt-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
