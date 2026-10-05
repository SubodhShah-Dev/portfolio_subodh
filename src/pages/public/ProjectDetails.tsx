import { PageSkeleton } from "../../components/common/Skeleton";

/**
 * Project detail route (/projects/:id) — loading, not-found, error, and
 * success states are all handled explicitly in Phase 8 (§53).
 */
export default function ProjectDetails() {
  return (
    <article>
      <h1 className="sr-only">Project details</h1>
      <PageSkeleton label="Loading project…" />
    </article>
  );
}
