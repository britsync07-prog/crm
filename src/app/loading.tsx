export default function RootLoading() {
  return (
    <div className="w-full min-h-[70vh] p-6 sm:p-10 space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/60 dark:border-blue-950/40">
        <div className="space-y-2.5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-blue-100/70 dark:border-blue-950/40 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/40 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Table / Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/40 border border-blue-100/70 dark:border-blue-950/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-blue-100/60 dark:border-blue-950/40 flex items-center justify-between">
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800/70 shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/40 rounded" />
                </div>
              </div>
              <div className="hidden sm:block h-6 w-24 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/50 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
