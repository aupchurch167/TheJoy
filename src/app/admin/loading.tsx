/**
 * Admin route-level loading skeleton. Shown via Suspense while a server page
 * fetches, so navigation never lands on a blank screen.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="admin-skeleton h-8 w-48 rounded-lg" />
        <div className="admin-skeleton mt-3 h-4 w-80 max-w-full rounded" />
      </div>

      {/* Stat row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-white p-5">
            <div className="admin-skeleton h-3 w-16 rounded" />
            <div className="admin-skeleton mt-3 h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Table / list */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <div className="admin-skeleton h-4 w-1/3 rounded" />
              <div className="admin-skeleton mt-2 h-3 w-1/4 rounded" />
            </div>
            <div className="admin-skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
