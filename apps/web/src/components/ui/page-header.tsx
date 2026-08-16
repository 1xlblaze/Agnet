import Link from "next/link";

export function PageHeader({
  label,
  title,
  description,
  backHref,
  backLabel,
  action,
}: {
  label?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="animate-fade-up">
      {backHref ? (
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-accent">
          <span aria-hidden>←</span> {backLabel || "Back"}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {label ? <p className="section-label">{label}</p> : null}
          <h1 className={`page-title ${label ? "mt-2" : ""}`}>{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-base text-text-secondary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
