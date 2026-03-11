import { StatusPill } from "@/components/status-pill";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({ eyebrow, title, description, badge }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">{eyebrow}</p>
        <h1 className="mt-3 display-font text-4xl font-semibold tracking-tight text-[color:var(--foreground)] lg:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">{description}</p>
      </div>
      {badge ? <StatusPill label={badge} tone="accent" /> : null}
    </header>
  );
}
