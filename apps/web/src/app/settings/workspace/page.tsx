import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getActiveWorkspace, getWorkspaceRoster } from "@/features/workspaces/workspace-service";
import { workspaceSettingsView } from "@/lib/settings";

const settingsTabs = [
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/sources", label: "Sources" },
  { href: "/settings/connections", label: "Connections" },
];

export default async function WorkspaceSettingsPage() {
  const [workspace, roster] = await Promise.all([getActiveWorkspace(), getWorkspaceRoster()]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Settings"
        title="Control the workspace, not just the queue"
        description="These settings are the baseline SaaS layer: configurable categories, approval rules, brand voice, and safe defaults that future customers can control without code changes."
        badge="workspace"
      />
      <SettingsTabs currentHref="/settings/workspace" />
      <div className="flex justify-end">
        <Link
          href="/workspaces/new"
          className="rounded-full bg-[color:var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,56,74,0.18)]"
        >
          Create workspace
        </Link>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Operational defaults</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SettingCard label="Timezone" value={workspaceSettingsView.timezone} />
            <SettingCard label="Approval flow" value={workspaceSettingsView.approvalRequired ? "Required before publish" : "Optional"} />
            <SettingCard label="Default posting mode" value={workspaceSettingsView.defaultPostingMode.replace("_", " ")} />
            <SettingCard label="Allowed lanes" value={`${workspaceSettingsView.allowedCategories.length} categories enabled`} />
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Brand voice notes</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">{workspaceSettingsView.brandVoiceNotes}</p>
          </div>
        </article>

        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Topic controls</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {workspaceSettingsView.allowedCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-[color:var(--navy)]/12 bg-[color:var(--navy)]/8 px-4 py-2 text-sm font-semibold capitalize text-[color:var(--navy)]"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-[#fff8f3] p-5">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Blocked terms</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {workspaceSettingsView.blockedTerms.map((term) => (
                <span key={term} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                  {term}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Workspace roster</p>
            <div className="mt-4 space-y-3">
              {roster.length === 0 ? (
                <div className="rounded-[1rem] bg-[#f6f1e8] px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  Only the seeded workspace is active right now.
                </div>
              ) : (
                roster.map((item) => (
                  <div key={item.id} className="rounded-[1rem] bg-[#f6f1e8] px-4 py-3">
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {item.slug} / {item.timezone}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}

function SettingsTabs({ currentHref }: { currentHref: string }) {
  return (
    <div className="surface rounded-[1.5rem] p-2">
      <div className="flex flex-wrap gap-2">
        {settingsTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              currentHref === tab.href
                ? "border border-[#0f2d3b] bg-[color:var(--navy)] !text-white shadow-[0_10px_24px_rgba(20,56,74,0.18)]"
                : "border border-transparent bg-white/72 !text-[color:var(--ink-soft)] hover:bg-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 text-base font-semibold capitalize text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
