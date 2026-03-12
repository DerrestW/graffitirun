type MetaPageOption = {
  id: string;
  name: string;
  accessToken: string;
  tasks: string[];
};

export function FacebookPagePicker({ pages }: { pages: MetaPageOption[] }) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[1.5rem] bg-white/82 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Select a Facebook Page</p>
      <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">Choose which Page this workspace should use</h3>
      <div className="mt-5 grid gap-4">
        {pages.map((page) => (
          <form key={page.id} action="/api/connect/facebook/select" method="post" className="rounded-[1.25rem] border border-[color:var(--border)] bg-[#fbf8f2] p-4">
            <input type="hidden" name="pageId" value={page.id} />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[color:var(--foreground)]">{page.name}</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">Page ID: {page.id}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {page.tasks.length > 0 ? page.tasks.join(", ") : "No task metadata returned"}
                </p>
              </div>
              <button type="submit" className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white">
                Use this Page
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
