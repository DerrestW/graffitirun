import { AppShell } from "@/components/app-shell";
import { ActionBanner } from "@/components/action-banner";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { runPublishJobAction } from "@/features/publishing/actions";
import { listPublishJobs } from "@/features/publishing/publishing-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatDateTime } from "@/lib/formatters";

type PublishingPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function PublishingPage({ searchParams }: PublishingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, jobs] = await Promise.all([getActiveWorkspace(), listPublishJobs()]);
  const queued = jobs.filter((job) => job.status === "queued" || job.status === "running");
  const succeeded = jobs.filter((job) => job.status === "succeeded");
  const failed = jobs.filter((job) => job.status === "failed");

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Publishing Queue"
        title="Connector-ready jobs with safe local stubs"
        description="The job model, schedule fields, and adapter contract are ready for Facebook wiring, while local development still runs without credentials or live publishing."
        badge="Facebook ready"
      />
      <section className="grid gap-6 xl:grid-cols-3">
        {[
          { title: "Scheduled", items: queued, tone: "accent" as const },
          { title: "Published", items: succeeded, tone: "success" as const },
          { title: "Failed", items: failed, tone: "danger" as const },
        ].map((column) => (
          <article key={column.title} className="surface rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-2xl font-semibold">{column.title}</h2>
              <StatusPill label={String(column.items.length)} tone={column.tone} />
            </div>
            <div className="mt-5 space-y-4">
              {column.items.map((job) => (
                <div key={job.id} className="rounded-[1.25rem] bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-[color:var(--foreground)]">{job.channelName}</p>
                    <StatusPill label={job.status} tone={column.tone} />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{formatDateTime(job.scheduledFor)}</p>
                  {job.errorMessage ? <p className="mt-3 text-sm text-[color:var(--danger)]">{job.errorMessage}</p> : null}
                  {(job.status === "queued" || job.status === "running") && column.title === "Scheduled" ? (
                    <form action={runPublishJobAction} className="mt-4">
                      <input type="hidden" name="jobId" value={job.id} />
                      <FormSubmitButton
                        idleLabel="Run now"
                        pendingLabel="Running..."
                        className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                      />
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
