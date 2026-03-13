type ActionBannerProps = {
  status?: string;
};

const bannerMap: Record<string, { tone: string; message: string }> = {
  draft_created: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Draft created from the selected topic.",
  },
  comment_added: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Review comment saved.",
  },
  draft_approved: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Draft approved and ready for scheduling.",
  },
  changes_requested: {
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    message: "Draft moved back into review for edits.",
  },
  draft_rejected: {
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    message: "Draft rejected.",
  },
  publish_queued: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Publish job queued.",
  },
  ingestion_completed: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Topic ingestion completed.",
  },
  publish_executed: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Publish job executed.",
  },
  publish_completed_cleared: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Completed publish jobs cleared.",
  },
  publish_stale_cleared: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Stale queued jobs cleared.",
  },
  publish_clear_failed: {
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    message: "Publish queue cleanup failed.",
  },
  publish_job_removed: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Publish job removed from the queue.",
  },
  sync_completed: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Meta insights synced.",
  },
  sync_failed: {
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    message: "Meta insights sync failed.",
  },
  facebook_connected: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Facebook Page connected.",
  },
  facebook_pick_page: {
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    message: "Choose which Facebook Page this workspace should use.",
  },
  facebook_no_pages: {
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    message: "Meta login worked, but no manageable Facebook Pages were returned.",
  },
  facebook_oauth_failed: {
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    message: "Facebook connection failed. Check the Meta app callback URL and permissions, then try again.",
  },
  unauthorized: {
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    message: "Your role is not allowed to perform that action.",
  },
};

export function ActionBanner({ status }: ActionBannerProps) {
  if (!status || !bannerMap[status]) {
    return null;
  }

  const banner = bannerMap[status];

  return <div className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${banner.tone}`}>{banner.message}</div>;
}
