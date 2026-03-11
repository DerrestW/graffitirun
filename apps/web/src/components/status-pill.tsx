type StatusPillProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
};

const toneMap = {
  neutral: "bg-white/70 text-[color:var(--ink-soft)]",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  accent: "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]",
} as const;

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
