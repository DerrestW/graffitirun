"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type DraftReviewControlsProps = {
  draftId: string;
  defaultScheduledFor?: string;
  disabled?: boolean;
};

type ActionState = "idle" | "commenting" | "approving" | "requesting" | "rejecting" | "scheduling" | "publishing";

export function DraftReviewControls({ draftId, defaultScheduledFor, disabled = false }: DraftReviewControlsProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduledFor ?? "");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function runAction(path: string, body: Record<string, string>, nextStatus: string, pendingState: ActionState) {
    setActionState(pendingState);
    setError(null);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; status?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Request failed.");
      }

      startTransition(() => {
        router.push(`/drafts/${draftId}?status=${result.status ?? nextStatus}`);
        router.refresh();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Request failed.");
    } finally {
      setActionState("idle");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Review Comments</p>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={5}
          placeholder="Add an internal review note..."
          className="mt-5 w-full rounded-[1.25rem] border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--foreground)] outline-none"
        />
        <button
          type="button"
          disabled={disabled || actionState !== "idle" || comment.trim().length === 0}
          onClick={() => runAction(`/api/drafts/${draftId}/comments`, { comment }, "comment_added", "commenting")}
          className="mt-3 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {actionState === "commenting" ? "Saving..." : "Add comment"}
        </button>
        {error ? <p className="mt-3 text-sm text-[color:var(--danger)]">{error}</p> : null}
      </article>
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Approval Actions</p>
        <div className="mt-5 grid gap-4">
          <button
            type="button"
            disabled={disabled || actionState !== "idle"}
            onClick={() => runAction(`/api/drafts/${draftId}/publish-now`, {}, "publish_executed", "publishing")}
            className="w-full rounded-[1.25rem] bg-[color:var(--navy)] px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionState === "publishing" ? "Publishing..." : "Publish now"}
          </button>
          <button
            type="button"
            disabled={disabled || actionState !== "idle"}
            onClick={() => runAction(`/api/drafts/${draftId}/status`, { action: "approve" }, "draft_approved", "approving")}
            className="w-full rounded-[1.25rem] bg-[color:var(--success)] px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionState === "approving" ? "Approving..." : "Approve"}
          </button>
          <button
            type="button"
            disabled={disabled || actionState !== "idle"}
            onClick={() => runAction(`/api/drafts/${draftId}/status`, { action: "request_changes" }, "changes_requested", "requesting")}
            className="w-full rounded-[1.25rem] bg-white/85 px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionState === "requesting" ? "Updating..." : "Request edits"}
          </button>
          <button
            type="button"
            disabled={disabled || actionState !== "idle"}
            onClick={() => runAction(`/api/drafts/${draftId}/status`, { action: "reject" }, "draft_rejected", "rejecting")}
            className="w-full rounded-[1.25rem] bg-[color:var(--danger)] px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionState === "rejecting" ? "Rejecting..." : "Reject"}
          </button>
        </div>
        <div className="mt-5 rounded-[1.25rem] bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--accent-strong)]">
          Publish now approves the draft, queues it, and immediately runs the job. Use scheduling when you want it held for later.
        </div>
        <label className="mt-5 block text-sm font-medium text-[color:var(--foreground)]">
          Schedule publish job
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] outline-none"
          />
        </label>
        <button
          type="button"
          disabled={disabled || actionState !== "idle" || scheduledFor.trim().length === 0}
          onClick={() => runAction(`/api/drafts/${draftId}/schedule`, { scheduledFor }, "publish_queued", "scheduling")}
          className="mt-3 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {actionState === "scheduling" ? "Queuing..." : "Queue publish job"}
        </button>
        {disabled ? (
          <p className="mt-3 text-sm text-[color:var(--ink-soft)]">
            This is a topic preview draft. Persist it first before comments, approvals, or publish actions are enabled.
          </p>
        ) : null}
      </article>
    </div>
  );
}
