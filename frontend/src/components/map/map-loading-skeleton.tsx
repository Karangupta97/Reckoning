export function MapLoadingSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: "100%" }}
    >
      <div className="h-full w-full bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]" />
    </div>
  );
}
