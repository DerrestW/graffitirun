"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type RunPublishJobButtonProps = {
  jobId: string;
};

export function RunPublishJobButton({ jobId }: RunPublishJobButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runJob() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/publish-jobs/${jobId}/run`, {
        method: "POST",
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Publish job failed.");
      }

      startTransition(() => {
        router.push("/publishing?status=publish_executed");
        router.refresh();
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Publish job failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={runJob}
        disabled={pending}
        className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Running..." : "Run now"}
      </button>
      {error ? <p className="mt-3 text-sm text-[color:var(--danger)]">{error}</p> : null}
    </div>
  );
}
