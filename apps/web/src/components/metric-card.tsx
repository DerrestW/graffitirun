type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="surface section-card rounded-[1.75rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-4 display-font text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">{value}</p>
      <p className="mt-3 max-w-[20rem] text-sm leading-6 text-[color:var(--ink-soft)]">{detail}</p>
    </article>
  );
}
