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
