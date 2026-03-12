import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { sourceSettingsView } from "@/lib/settings";

const settingsTabs = [
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/sources", label: "Sources" },
  { href: "/settings/connections", label: "Connections" },
];

export default async function SourcesSettingsPage() {
  const workspace = await getActiveWorkspace();

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Sources"
        title="Control which feeds and topics enter the engine"
        description="This is the configuration layer for real customers: source toggles, category lanes, feed URLs, and image-handling policy per feed."
        badge={`${sourceSettingsView.feeds.length} feeds`}
      />
      <SettingsTabs currentHref="/settings/sources" />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Enabled topic lanes</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {sourceSettingsView.topicsEnabled.map((topic) => (
              <span key={topic} className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold capitalize text-white">
                {topic}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5 text-sm leading-7 text-[color:var(--ink-soft)]">
            When multiple feeds are live, the queue can be workspace-specific without code changes. This is where agencies and future customers decide what kinds of topics their brand wants to surface.
          </div>
        </article>

        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Feed roster</p>
          <div className="mt-5 space-y-4">
            {sourceSettingsView.feeds.map((feed) => (
              <div key={feed.id} className="rounded-[1.35rem] bg-white/82 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[color:var(--foreground)]">{feed.label}</p>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{feed.feedUrl}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      feed.enabled ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]" : "bg-[#ece8dd] text-[color:var(--muted)]"
                    }`}
                  >
                    {feed.enabled ? "enabled" : "standby"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <FeedMeta label="Category" value={feed.category} />
                  <FeedMeta label="Image mode" value={feed.imageMode.replaceAll("_", " ")} />
                  <FeedMeta label="Status" value={feed.enabled ? "live" : "waiting"} />
                </div>
              </div>
            ))}
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
            className={`rounded-full px-4 py-3 text-sm font-semibold no-underline transition ${
              currentHref === tab.href
                ? "border border-[#0f2d3b] bg-[color:var(--navy)] !text-white shadow-[0_10px_24px_rgba(20,56,74,0.24)] hover:brightness-110"
                : "border border-[color:var(--border)] bg-white !text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] hover:bg-[#fffaf3]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeedMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-[#f6f1e8] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
