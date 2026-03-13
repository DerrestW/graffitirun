import { AppShell } from "@/components/app-shell";
import { ActionBanner } from "@/components/action-banner";
import { PageHeader } from "@/components/page-header";
import { clearPublishJobsAction } from "@/features/publishing/actions";
import { StatusPill } from "@/components/status-pill";
import { RunPublishJobButton } from "@/features/publishing/components/run-publish-job-button";
import { listPublishJobs } from "@/features/publishing/publishing-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatDateTime } from "@/lib/formatters";
import { getMetaIntegrationStatus } from "@/lib/integrations/meta";
import { getXIntegrationStatus } from "@/lib/integrations/x";

type PublishingPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function PublishingPage({ searchParams }: PublishingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, jobs] = await Promise.all([getActiveWorkspace(), listPublishJobs()]);
  const meta = getMetaIntegrationStatus();
  const x = getXIntegrationStatus();
  const queued = jobs.filter((job) => job.status === "queued" || job.status === "running");
  const succeeded = jobs.filter((job) => job.status === "succeeded");
  const failed = jobs.filter((job) => job.status === "failed");

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Publishing Queue"
        title="Connector-ready jobs with safe local execution"
        description="The queue is split by state and can run through local-safe adapters while remaining structured for future Facebook and X wiring."
        badge="multi-channel ready"
      />
      <section className="mb-6 flex flex-wrap gap-3">
        <form action={clearPublishJobsAction}>
          <input type="hidden" name="mode" value="completed" />
          <button
            type="submit"
            className="rounded-full bg-[#103d52] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3142]"
          >
            Clear completed jobs
          </button>
        </form>
        <form action={clearPublishJobsAction}>
          <input type="hidden" name="mode" value="stale" />
          <button
            type="submit"
            className="rounded-full border border-[#103d52]/18 bg-white px-4 py-2 text-sm font-semibold text-[#103d52] transition hover:border-[#103d52]/28 hover:bg-[#f7f4ee]"
          >
            Clear stale queued jobs
          </button>
        </form>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Channel readiness</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Publishing readiness</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.4rem] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">Facebook</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Page ID</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{meta.pageIdPresent ? "Configured" : "Missing"}</p>
                </div>
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Token</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{meta.tokenPresent ? "Configured" : "Missing"}</p>
                </div>
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Graph</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{meta.graphVersion}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.4rem] bg-white/80 p-4">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">X</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Handle</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{x.accountHandle ? `@${x.accountHandle.replace(/^@/, "")}` : "Missing"}</p>
                </div>
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Publishing</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{x.publishingReady ? "Ready" : "Missing"}</p>
                </div>
                <div className="rounded-[1rem] bg-[#f6f1e8] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Ingestion</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">{x.ingestionReady ? "Ready" : "Missing"}</p>
                </div>
              </div>
            </div>
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Live publish requirements</p>
          <ul className="mt-4 space-y-3 text-sm text-[color:var(--ink-soft)]">
            <li>Render asset to a publicly reachable storage URL.</li>
            <li>Connect at least one channel, starting with Facebook or X.</li>
            <li>Send final caption plus rendered asset through the selected channel adapter.</li>
          </ul>
        </article>
      </section>
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
                    <RunPublishJobButton jobId={job.id} />
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
