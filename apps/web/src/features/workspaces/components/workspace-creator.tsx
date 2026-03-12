"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const categoryOptions = ["sports", "weather", "running", "health", "lifting", "animals", "celebrity"];

export function WorkspaceCreator() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [brandVoiceNotes, setBrandVoiceNotes] = useState("");
  const [categories, setCategories] = useState<string[]>(["sports", "weather", "running"]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          timezone,
          approvalRequired,
          categories,
          brandVoiceNotes,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; workspace?: { slug: string } };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Workspace creation failed.");
      }

      setStatus(`Workspace created. ${name} is now the active local workspace.`);
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Workspace creation failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Create Workspace</p>
        <h2 className="mt-3 display-font text-3xl font-semibold text-[color:var(--foreground)]">Launch a new content operation</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          This creates a new local workspace in development mode so you can test branding, templates, sources, and publishing setup like a future customer would.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Workspace name">
            <input
              type="text"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slug) {
                  setSlug(
                    nextName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  );
                }
              }}
              className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
              placeholder="Runner Room Media"
              required
            />
          </Field>
          <Field label="Workspace slug">
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
              placeholder="runner-room-media"
              required
            />
          </Field>
          <Field label="Timezone">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            >
              {["America/Chicago", "America/New_York", "America/Los_Angeles", "UTC"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <label className="rounded-[1rem] bg-white/82 px-4 py-4 text-sm font-medium text-[color:var(--foreground)]">
            <span className="block">Approval required</span>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setApprovalRequired(true)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${approvalRequired ? "bg-[color:var(--navy)] text-white" : "bg-[#f5efe6] text-[color:var(--foreground)]"}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setApprovalRequired(false)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${!approvalRequired ? "bg-[color:var(--navy)] text-white" : "bg-[#f5efe6] text-[color:var(--foreground)]"}`}
              >
                No
              </button>
            </div>
          </label>
        </div>

        <Field label="Brand voice notes">
          <textarea
            value={brandVoiceNotes}
            onChange={(event) => setBrandVoiceNotes(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            placeholder="Curiosity-led, operational, and easy to scan. Avoid tabloidy phrasing."
          />
        </Field>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Creating workspace..." : "Create workspace"}
          </button>
          <a href="/settings/workspace" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]">
            Back to settings
          </a>
        </div>
        {status ? <p className="mt-4 text-sm text-[color:var(--ink-soft)]">{status}</p> : null}
      </article>

      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Category lanes</p>
        <h3 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">Choose what enters the queue</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {categoryOptions.map((category) => {
            const active = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setCategories((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]))
                }
                className={`rounded-[1.1rem] border px-4 py-4 text-left transition ${
                  active ? "border-[color:var(--navy)] bg-[color:var(--navy)] text-white" : "border-[color:var(--border)] bg-white/82 text-[color:var(--foreground)]"
                }`}
              >
                <div className="text-sm font-semibold capitalize">{category}</div>
                <div className={`mt-2 text-xs uppercase tracking-[0.18em] ${active ? "text-white/72" : "text-[color:var(--muted)]"}`}>
                  {active ? "enabled" : "disabled"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[#f7f1e8] p-5">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">What gets created next</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "Workspace shell and slug",
              "Owner context in local dev mode",
              "Allowed content lanes",
              "Approval requirement defaults",
            ].map((item) => (
              <div key={item} className="rounded-[1rem] bg-white/86 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </article>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-6 block text-sm font-medium text-[color:var(--foreground)]">
      {label}
      {children}
    </label>
  );
}
