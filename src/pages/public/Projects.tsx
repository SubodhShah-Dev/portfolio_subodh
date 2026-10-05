import { PageSkeleton } from "../../components/common/Skeleton";

/**
 * Published project listing with technology filtering (§13).
 * Loads Firestore data in Phase 8 — loading state shown meanwhile.
 */
export default function Projects() {
  return (
    <section aria-labelledby="projects-heading">
      <h1 id="projects-heading" className="text-2xl font-semibold text-slate-100">
        Projects
      </h1>
      <div className="mt-6">
        <PageSkeleton label="Loading projects…" />
      </div>
    </section>
  );
}
