import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/layout/site-nav";
import { IntegrationsStatus } from "@/components/layout/integrations-status";

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
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="min-h-screen bg-canvas">
          <header className="border-b border-hairline bg-canvas/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                    AG
                  </span>
                  <p className="font-display text-3xl tracking-[-0.03em] text-ink md:text-4xl">AgentGuard</p>
                </div>
                <p className="mt-2 max-w-xl text-sm text-body md:text-base">
                  Evidence-first verification for AI-generated changes before production.
                </p>
                <div className="mt-3">
                  <IntegrationsStatus />
                </div>
              </div>
              <SiteNav />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
