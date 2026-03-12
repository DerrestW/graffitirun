import { syncMetaInsightsAction } from "@/features/analytics/actions";

export function SyncMetaInsightsButton() {
  return (
    <form action={syncMetaInsightsAction}>
      <button
        type="submit"
        className="rounded-full bg-[color:var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,56,74,0.18)]"
      >
        Sync Meta insights
      </button>
    </form>
  );
}
