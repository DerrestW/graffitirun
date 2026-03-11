import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { listTemplates } from "@/features/templates/template-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";

export default async function TemplatesPage() {
  const [workspace, templates] = await Promise.all([getActiveWorkspace(), listTemplates()]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Template Manager"
        title="Brand-safe templates that stay workspace scoped"
        description="Each template is clonable, workspace-specific, and ready for static composition. The model is shaped so future clients can customize layouts without rewriting the render pipeline."
        badge={`${templates.length} templates`}
      />
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="surface rounded-[1.75rem] p-5">
            <div className="overflow-hidden rounded-[1.5rem] bg-[color:var(--navy)] p-4 text-white">
              <div className="flex aspect-square flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between">
                  <StatusPill label={template.templateType} tone="accent" />
                  {template.isDefault ? <StatusPill label="default" tone="success" /> : null}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/55">Preview</p>
                  <h2 className="mt-3 display-font text-3xl font-semibold leading-tight">{template.name}</h2>
                </div>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{template.width}x{template.height}</span>
                  <span>{template.accentColor}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[color:var(--ink-soft)]">{template.notes}</p>
            <div className="mt-5 flex gap-3">
              <button className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">Set default</button>
              <button className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]">Duplicate</button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
