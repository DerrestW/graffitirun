import Link from "next/link";
import { FacebookPagePicker } from "@/features/settings/components/facebook-page-picker";
import { FacebookConnectorForm } from "@/features/settings/components/facebook-connector-form";
import { XConnectorForm } from "@/features/settings/components/x-connector-form";

type MetaStatus = {
  graphVersion: string;
  publishingReady: boolean;
  insightsReady: boolean;
  monetizationReady: boolean;
  configReady: boolean;
  pageIdPresent: boolean;
  tokenPresent: boolean;
  appConfigured: boolean;
};

type XStatus = {
  accountHandle: string;
  apiKeyPresent: boolean;
  apiSecretPresent: boolean;
  bearerTokenPresent: boolean;
  publishingReady: boolean;
  ingestionReady: boolean;
  configReady: boolean;
};

export function ConnectionSetupPanel({
  connector,
  metaStatus,
  xStatus,
  facebookPages,
  facebookConnectedPage,
}: {
  connector: string | undefined;
  metaStatus: MetaStatus;
  xStatus: XStatus;
  facebookPages: Array<{ id: string; name: string; accessToken: string; tasks: string[] }>;
  facebookConnectedPage: { name: string; id: string; source: "env" | "channel" | "oauth_user" } | null;
}) {
  if (!connector) {
    return null;
  }

  if (connector === "x") {
    return (
      <article className="surface rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">X Connector</p>
            <h2 className="mt-2 display-font text-3xl font-semibold text-[color:var(--foreground)]">Configure X publishing and ingestion</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--ink-soft)]">
              X should be treated as both a future publishing destination and a source lane for tracked user accounts, but through API-backed adapters rather than pretending user RSS feeds are a first-class official integration.
            </p>
          </div>
          <Link href="/settings/connections" className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold no-underline text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            Close
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] bg-white/82 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Configuration Status</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Account handle", ok: Boolean(xStatus.accountHandle), note: "Use the brand or publisher account handle." },
                { label: "API key", ok: xStatus.apiKeyPresent, note: "Needed for publish/auth flows." },
                { label: "API secret", ok: xStatus.apiSecretPresent, note: "Pairs with the X API key." },
                { label: "Bearer token", ok: xStatus.bearerTokenPresent, note: "Needed for API-based ingestion and timeline access." },
              ].map((step) => (
                <div key={step.label} className="rounded-[1.1rem] border border-[color:var(--border)] bg-[#fbf8f2] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">{step.label}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${step.ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {step.ok ? "ready" : "missing"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{step.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-[color:var(--navy)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/64">Recommended use</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/82">
              <p>1. Connect the brand X account for future posting.</p>
              <p>2. Track selected X users through API-backed ingestion.</p>
              <p>3. Normalize posts into topic candidates before drafting.</p>
              <p>4. Keep the same review and approval workflow before distribution.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Required env vars</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {["X_ACCOUNT_HANDLE", "X_API_KEY", "X_API_SECRET", "X_BEARER_TOKEN"].map((item) => (
              <div key={item} className="rounded-[1rem] bg-[#f5efe6] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <XConnectorForm xStatus={xStatus} initialHandle="graffitirun" />
        </div>
      </article>
    );
  }

  if (connector !== "facebook") {
    return (
      <article className="surface rounded-[1.75rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Connector Setup</p>
            <h2 className="mt-2 display-font text-3xl font-semibold text-[color:var(--foreground)]">Roadmap lane</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              This connector is not wired yet. Facebook and X are now the first structured channel lanes; Instagram remains planned until those are stable.
            </p>
          </div>
          <Link href="/settings/connections" className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold no-underline text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            Close
          </Link>
        </div>
      </article>
    );
  }

  const steps = [
    { label: "Meta app configured", ok: metaStatus.appConfigured, note: "Requires META_APP_ID and META_APP_SECRET." },
    { label: "Page selected", ok: metaStatus.pageIdPresent, note: "Requires META_PAGE_ID." },
    { label: "Page token stored", ok: metaStatus.tokenPresent, note: "Requires META_PAGE_ACCESS_TOKEN." },
    { label: "Publishing ready", ok: metaStatus.publishingReady, note: "Feed publishing can use the connected Page." },
    { label: "Insights ready", ok: metaStatus.insightsReady, note: "Post and Page metrics can be synced." },
  ];

  return (
    <article className="surface rounded-[1.75rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Facebook Connector</p>
          <h2 className="mt-2 display-font text-3xl font-semibold text-[color:var(--foreground)]">Configure Meta publishing</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--ink-soft)]">
            This is the connection the workspace will use for Facebook feed publishing, post metrics sync, and future monetization reporting where Meta exposes those fields.
          </p>
        </div>
        <Link href="/settings/connections" className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold no-underline text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          Close
        </Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] bg-white/82 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Configuration Status</p>
          <div className="mt-4 space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="rounded-[1.1rem] border border-[color:var(--border)] bg-[#fbf8f2] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--foreground)]">{step.label}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      step.ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {step.ok ? "ready" : "missing"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{step.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[color:var(--navy)] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/64">How account sync should work</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/82">
            <p>1. Sign in with the Facebook profile that manages the Page.</p>
            <p>2. Grant Page permissions for publishing and insights.</p>
            <p>3. Pick the Page this workspace should use.</p>
            <p>4. Save the Page ID and encrypted Page token.</p>
            <p>5. Publish approved drafts and sync post performance daily.</p>
          </div>
          <div className="mt-5 rounded-[1.25rem] bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/62">Current env status</p>
            <p className="mt-3 text-sm text-white/82">Graph version: {metaStatus.graphVersion}</p>
            <p className="mt-1 text-sm text-white/82">
              Connector state: {metaStatus.configReady ? "ready for live implementation" : "waiting on Meta credentials"}
            </p>
            <p className="mt-1 text-sm text-white/82">
              Monetization sync: {metaStatus.monetizationReady ? "possible where Meta exposes it" : "not configured yet"}
            </p>
            {facebookConnectedPage ? (
              <p className="mt-3 text-sm text-white/82">
                Connected Page: {facebookConnectedPage.name} ({facebookConnectedPage.source})
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/api/connect/facebook/start" className="rounded-full bg-[color:var(--navy)] px-5 py-3 text-sm font-semibold no-underline text-white shadow-[0_10px_24px_rgba(20,56,74,0.22)] hover:brightness-110">
          Connect with Facebook
        </a>
        <a
          href="https://developers.facebook.com/apps/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold no-underline text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] hover:bg-[#f6f1e9]"
        >
          Open Meta app settings
        </a>
      </div>

      {facebookPages.length > 0 ? <FacebookPagePicker pages={facebookPages} /> : null}

      <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Required env vars</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["META_APP_ID", "META_APP_SECRET", "META_PAGE_ID", "META_PAGE_ACCESS_TOKEN"].map((item) => (
            <div key={item} className="rounded-[1rem] bg-[#f5efe6] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Do users need a Meta app?</p>
        <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Yes, for live Facebook publishing</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--ink-soft)]">
          If you want real Facebook feed publishing and insights sync, the workspace owner needs a Meta developer app tied to the Facebook profile that manages the Page. For local testing, the app can still run in stub mode without this.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.25rem] bg-[#f8f3eb] p-5">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">How to create it</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              <p>1. Log into Meta for Developers with the Facebook account that manages the Page.</p>
              <p>2. Create a new app in the developer dashboard.</p>
              <p>3. Add the Facebook Login and Pages-related products/permissions you need.</p>
              <p>4. Generate or retrieve the Page access token from the Page the user selects.</p>
              <p>5. Paste the App ID, App Secret, Page ID, and Page token into this connector screen.</p>
            </div>
          </div>
          <div className="rounded-[1.25rem] bg-[color:var(--navy)] p-5 text-white">
            <p className="text-sm font-semibold text-white">Official links</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
                className="rounded-[1rem] bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/16"
              >
                Open Meta app dashboard
              </a>
              <a
                href="https://developers.facebook.com/docs/platforminsights/page"
                target="_blank"
                rel="noreferrer"
                className="rounded-[1rem] bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/16"
              >
                Read Page Insights docs
              </a>
              <a
                href="https://developers.facebook.com/docs/pages-api/"
                target="_blank"
                rel="noreferrer"
                className="rounded-[1rem] bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/16"
              >
                Read Pages API docs
              </a>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-[1.25rem] bg-[#fff8ee] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          For Page and post insights, Meta’s Page Insights docs require `pages_read_engagement`, `read_insights`, and a Page access token. Some monetization metrics require additional monetization access. Source: <a href="https://developers.facebook.com/docs/platforminsights/page" target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--accent-strong)]">Meta Page Insights docs</a>.
        </div>
      </div>

      <div className="mt-6">
        <FacebookConnectorForm metaStatus={metaStatus} initialPageName="Graffiti Run Facebook Page" />
      </div>
    </article>
  );
}
