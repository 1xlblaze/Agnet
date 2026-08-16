import { cn } from "@/lib/utils";

const variants = {
  ALLOW: "bg-[#1f8a65]/15 text-[#1f8a65] border-[#1f8a65]/30",
  BLOCK: "bg-[#cf2d56]/15 text-[#cf2d56] border-[#cf2d56]/30",
  HUMAN_APPROVAL: "bg-[#c08532]/15 text-[#c08532] border-[#c08532]/30",
  CRITICAL: "bg-[#cf2d56]/15 text-[#cf2d56] border-[#cf2d56]/30",
  HIGH: "bg-[#f54e00]/15 text-[#d04200] border-[#f54e00]/30",
  MEDIUM: "bg-[#c08532]/15 text-[#c08532] border-[#c08532]/30",
  LOW: "bg-[#807d72]/15 text-[#5a5852] border-[#cfcdc4]",
  open: "bg-[#9fbbe0]/20 text-[#3d5a80] border-[#9fbbe0]/40",
  resolved: "bg-[#9fc9a2]/20 text-[#1f6f5b] border-[#9fc9a2]/40",
} as const;

export function StatusBadge({
  label,
  variant = "LOW",
  className,
}: {
  label: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        variants[variant] || variants.LOW,
        className,
      )}
    >
      {label}
    </span>
  );
}
