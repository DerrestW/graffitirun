"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type XStatus = {
  accountHandle: string;
  apiKeyPresent: boolean;
  apiSecretPresent: boolean;
  bearerTokenPresent: boolean;
  publishingReady: boolean;
  ingestionReady: boolean;
  configReady: boolean;
};

type XConnectorDraft = {
  accountHandle: string;
  apiKey: string;
  apiSecret: string;
  bearerToken: string;
};

const storageKey = "graffiti-run-x-connector";

export function XConnectorForm({ xStatus, initialHandle }: { xStatus: XStatus; initialHandle: string }) {
  const [draft, setDraft] = useState<XConnectorDraft>(() => {
    if (typeof window === "undefined") {
      return { accountHandle: initialHandle, apiKey: "", apiSecret: "", bearerToken: "" };
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as XConnectorDraft) : { accountHandle: initialHandle, apiKey: "", apiSecret: "", bearerToken: "" };
    } catch {
      return { accountHandle: initialHandle, apiKey: "", apiSecret: "", bearerToken: "" };
    }
  });
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setStatus("X connector values saved locally in this browser.");
  }

  function reset() {
    const next = { accountHandle: initialHandle, apiKey: "", apiSecret: "", bearerToken: "" };
    setDraft(next);
    window.localStorage.removeItem(storageKey);
    setStatus("Cleared local X connector values.");
  }

  const localReady = Boolean(draft.accountHandle && draft.apiKey && draft.apiSecret);

  return (
    <div className="rounded-[1.5rem] bg-white/82 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">X Connector Inputs</p>
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Enter X account details</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
            Use this lane for future publishing and for ingesting posts from X users through API-backed adapters rather than pretending there is a clean official RSS feed for user timelines.
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
        <Field label="X account handle">
          <input
            type="text"
            value={draft.accountHandle}
            onChange={(event) => setDraft((current) => ({ ...current, accountHandle: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="X API key">
          <input
            type="text"
            value={draft.apiKey}
            onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="X API secret">
          <input
            type="password"
            value={draft.apiSecret}
            onChange={(event) => setDraft((current) => ({ ...current, apiSecret: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="X bearer token">
          <input
            type="password"
            value={draft.bearerToken}
            onChange={(event) => setDraft((current) => ({ ...current, bearerToken: event.target.value }))}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Env account" value={xStatus.accountHandle ? "configured" : "missing"} />
        <MiniStat label="Env publishing" value={xStatus.publishingReady ? "ready" : "missing"} />
        <MiniStat label="Env ingestion" value={xStatus.ingestionReady ? "ready" : "missing"} />
        <MiniStat label="Local account" value={draft.accountHandle ? `@${draft.accountHandle.replace(/^@/, "")}` : "missing"} />
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
