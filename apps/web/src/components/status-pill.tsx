type StatusPillProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
};

const toneMap = {
  neutral: "border border-white/60 bg-white/72 text-[color:var(--ink-soft)]",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border border-amber-200 bg-amber-50 text-amber-800",
  danger: "border border-rose-200 bg-rose-50 text-rose-800",
  accent: "border border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]",
} as const;

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.24em] uppercase ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
