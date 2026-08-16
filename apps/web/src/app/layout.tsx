import Link from "next/link";
import "./globals.css";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/pull-requests", label: "Pull Requests" },
  { href: "/deployments", label: "Deployments" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;700&family=Source+Sans+3:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-foam/10 bg-ink/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <Link href="/" className="min-w-0">
                <p className="font-display text-2xl font-bold tracking-tight text-foam sm:text-3xl">AgentGuard</p>
                <p className="hidden text-xs text-sand/70 sm:block">Verify AI-generated changes before production</p>
              </Link>
              <nav className="flex flex-wrap justify-end gap-1 sm:gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-sand/80 transition hover:bg-foam/5 hover:text-foam sm:px-3 sm:text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
