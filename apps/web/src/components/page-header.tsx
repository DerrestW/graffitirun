import { StatusPill } from "@/components/status-pill";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({ eyebrow, title, description, badge }: PageHeaderProps) {
  return (
    <header className="overflow-hidden rounded-[2rem] border border-[#1b2f39] bg-[linear-gradient(135deg,#102f3d,#193e50_58%,#35535f)] px-6 py-7 text-white shadow-[0_28px_80px_rgba(14,23,29,0.24)] lg:px-8 lg:py-8">
      <div className="paper-grid relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#f0c889]">{eyebrow}</p>
          <h1 className="mt-3 display-font text-4xl font-semibold tracking-[-0.04em] text-white lg:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">{description}</p>
        </div>
        {badge ? <StatusPill label={badge} tone="accent" /> : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.24em] text-white/62">
        <span>Source traceable</span>
        <span>Approval gated</span>
        <span>Workspace scoped</span>
      </div>
    </header>
  );
}
