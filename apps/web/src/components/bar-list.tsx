type BarListProps = {
  items: Array<{ label: string; value: number }>;
  accent?: string;
};

export function BarList({ items, accent = "var(--accent)" }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[color:var(--foreground)]">{item.label}</span>
            <span className="font-medium text-[color:var(--ink-soft)]">{item.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/70">
            <div
              className="h-2.5 rounded-full shadow-[0_8px_18px_rgba(20,56,74,0.2)]"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: accent,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
