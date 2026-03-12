import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { CustomTemplateBuilder } from "@/features/templates/components/custom-template-builder";
import { listTemplates } from "@/features/templates/template-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";

type TemplatesPageProps = {
  searchParams?: Promise<{ selected?: string }>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, templates] = await Promise.all([getActiveWorkspace(), listTemplates()]);
  const selectedTemplate = templates.find((template) => template.id === resolvedSearchParams?.selected) ?? templates[0];

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Template Manager"
        title="Choose the layout before you polish the copy"
        description="Templates now act like real layout systems: different headline positions, summary treatments, background moods, and inset-image behavior. Pick the composition first, then tune the draft inside that frame."
        badge={`${templates.length} templates`}
      />
      <section className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Selected Template</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="display-font text-3xl font-semibold text-[color:var(--foreground)]">{selectedTemplate.name}</h2>
            <StatusPill label={selectedTemplate.templateType} tone="accent" />
            {selectedTemplate.isDefault ? <StatusPill label="default" tone="success" /> : null}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">{selectedTemplate.notes}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Headline Placement</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{selectedTemplate.headlinePlacement}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Subheader Placement</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{selectedTemplate.subheadlinePlacement}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Background Treatment</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{selectedTemplate.backgroundStyle}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Best Use</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{selectedTemplate.layoutLabel}</p>
            </div>
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Layout Strategy</p>
          <div className="mt-4 space-y-4 text-sm leading-6 text-[color:var(--ink-soft)]">
            <p>Use top-banner layouts when the headline is the whole hook. Use center-card layouts when the photo deserves more breathing room.</p>
            <p>Lower-third layouts are best for feed posts because the text stays readable without covering the face or subject. Story layouts can push more copy lower because viewers tap through vertically.</p>
            <p>Editorial and split layouts work best when you need a stronger subheader or second beat, not just a single loud headline.</p>
          </div>
        </article>
      </section>
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.id}
            className={`surface rounded-[1.75rem] p-5 transition ${
              selectedTemplate.id === template.id ? "ring-2 ring-[color:var(--accent)] shadow-[0_20px_60px_rgba(20,56,74,0.16)]" : ""
            }`}
          >
            <div className="overflow-hidden rounded-[1.5rem] bg-[color:var(--navy)] p-4 text-white">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between">
                  <StatusPill label={template.templateType} tone="accent" />
                  {template.isDefault ? <StatusPill label="default" tone="success" /> : null}
                </div>
                <div className="mt-4 overflow-hidden rounded-[1rem] bg-black/15">
                  <Image
                    src={`/api/renders/templates/${template.id}`}
                    alt={`${template.name} preview`}
                    width={template.width}
                    height={template.height}
                    unoptimized
                    className="h-auto w-full"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                  <span>{template.width}x{template.height}</span>
                  <span>{template.accentColor}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">{template.name}</h2>
              {template.layoutLabel ? <StatusPill label={template.layoutLabel} /> : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-[color:var(--ink-soft)]">{template.notes}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[color:var(--ink-soft)]">
              <div className="rounded-[1rem] bg-white/70 px-3 py-2">Headline: {template.headlinePlacement}</div>
              <div className="rounded-[1rem] bg-white/70 px-3 py-2">Subheader: {template.subheadlinePlacement}</div>
              <div className="rounded-[1rem] bg-white/70 px-3 py-2">Background: {template.backgroundStyle}</div>
              <div className="rounded-[1rem] bg-white/70 px-3 py-2">Headline max {template.headlineLimit}</div>
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                href={`/templates?selected=${template.id}`}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                {selectedTemplate.id === template.id ? "Selected" : "Preview layout"}
              </Link>
              <Link
                href={`/drafts/draft-1?template=${template.id}`}
                className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
              >
                Use in Draft Studio
              </Link>
            </div>
          </article>
        ))}
      </section>
      <div className="mt-6">
        <CustomTemplateBuilder initialTemplates={templates} />
      </div>
    </AppShell>
  );
}
