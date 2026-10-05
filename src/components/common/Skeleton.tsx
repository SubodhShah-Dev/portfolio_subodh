/**
 * Loading skeleton primitives (§44).
 *
 * Inline utility classes (not @apply-composed) so arbitrary Tailwind
 * candidates are available in every build.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-800 ${className}`}
    />
  );
}

/** Full-page skeleton for initial data loads — avoids blank areas (§44). */
export function PageSkeleton({ label = "Loading content…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-5/6 max-w-xl" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
