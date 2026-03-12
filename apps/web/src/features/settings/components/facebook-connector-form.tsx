"use client";

import type { ReactNode } from "react";
import { useState } from "react";

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

type ConnectorDraft = {
  pageName: string;
  appId: string;
  appSecret: string;
  pageId: string;
  pageAccessToken: string;
};

const storageKey = "graffiti-run-facebook-connector";

export function FacebookConnectorForm({
  metaStatus,
  initialPageName,
}: {
  metaStatus: MetaStatus;
  initialPageName: string;
}) {
  const [draft, setDraft] = useState<ConnectorDraft>(() => {
    if (typeof window === "undefined") {
      return {
        pageName: initialPageName,
        appId: "",
        appSecret: "",
        pageId: "",
        pageAccessToken: "",
      };
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return {
          pageName: initialPageName,
          appId: "",
          appSecret: "",
          pageId: "",
          pageAccessToken: "",
        };
      }

      return JSON.parse(raw) as ConnectorDraft;
    } catch {
      return {
        pageName: initialPageName,
        appId: "",
        appSecret: "",
        pageId: "",
        pageAccessToken: "",
      };
    }
  });
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setStatus("Facebook connector values saved locally in this browser.");
  }

  function reset() {
    const next = {
      pageName: initialPageName,
      appId: "",
      appSecret: "",
      pageId: "",
      pageAccessToken: "",
    };
    setDraft(next);
    window.localStorage.removeItem(storageKey);
    setStatus("Cleared local connector values.");
  }

  const localReady = Boolean(draft.appId && draft.appSecret && draft.pageId && draft.pageAccessToken);

  return (
    <div className="rounded-[1.5rem] bg-white/82 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Connector Inputs</p>
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Enter Facebook connection details</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
            This is a local setup form for now. It does not write encrypted secrets to the server yet, but it gives you a real place to configure the account flow in the app.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            localReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {localReady ? "local setup complete" : "local setup incomplete"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Facebook Page name">
          <input
            type="text"
            value={draft.pageName}
            onChange={(event) => setDraft((current) => ({ ...current, pageName: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Meta App ID">
          <input
            type="text"
            value={draft.appId}
            onChange={(event) => setDraft((current) => ({ ...current, appId: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Meta App Secret">
          <input
            type="password"
            value={draft.appSecret}
            onChange={(event) => setDraft((current) => ({ ...current, appSecret: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Facebook Page ID">
          <input
            type="text"
            value={draft.pageId}
            onChange={(event) => setDraft((current) => ({ ...current, pageId: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Facebook Page access token">
            <textarea
              value={draft.pageAccessToken}
              onChange={(event) => setDraft((current) => ({ ...current, pageAccessToken: event.target.value }))}
              rows={5}
              className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Env Graph version" value={metaStatus.graphVersion} />
        <MiniStat label="Env publishing" value={metaStatus.publishingReady ? "ready" : "missing"} />
        <MiniStat label="Local page id" value={draft.pageId ? "entered" : "missing"} />
        <MiniStat label="Local token" value={draft.pageAccessToken ? "entered" : "missing"} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={save} className="rounded-full bg-[color:var(--navy)] px-5 py-3 text-sm font-semibold text-white">
          Save connector values
        </button>
        <button type="button" onClick={reset} className="rounded-full bg-[#f4e6df] px-5 py-3 text-sm font-semibold text-[#8c3e22]">
          Clear values
        </button>
      </div>

      {status ? <p className="mt-4 text-sm text-[color:var(--ink-soft)]">{status}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[color:var(--foreground)]">
      {label}
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-[#f5efe6] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
