export function statusVariant(status: string): "success" | "warn" | "danger" | "neutral" {
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("passed") || s.includes("ready") || s.includes("complete")) return "success";
  if (s.includes("pending") || s.includes("scan") || s.includes("progress")) return "warn";
  if (s.includes("fail") || s.includes("error") || s.includes("block")) return "danger";
  return "neutral";
}

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariant(status);
  const cls =
    variant === "success"
      ? "badge-success"
      : variant === "warn"
        ? "badge-warn"
        : variant === "danger"
          ? "badge-danger"
          : "badge-neutral";
  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}
