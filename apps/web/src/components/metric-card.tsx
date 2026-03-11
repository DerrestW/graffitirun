type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="surface rounded-[1.75rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 display-font text-3xl font-semibold text-[color:var(--foreground)]">{value}</p>
      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{detail}</p>
    </article>
  );
}
