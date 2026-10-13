import type { Project } from "../../types/project";

const LABELS: Record<NonNullable<Project["lifecycle"]>, string> = {
  shipped: "Shipped",
  "in-progress": "In progress",
  planned: "Planned",
};

/** Public lifecycle chip — mono badge beside the project title (§10). */
export function LifecycleChip({
  lifecycle,
}: {
  lifecycle?: Project["lifecycle"];
}) {
  if (lifecycle === undefined) return null;
  return (
    <span className="border border-hairline bg-raised px-2 py-0.5 font-meta text-[11px] text-muted">
      {LABELS[lifecycle]}
    </span>
  );
}
