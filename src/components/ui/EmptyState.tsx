import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional primary action (e.g. "Create your first project"). */
  action?: ReactNode;
}

/**
 * Empty-state placeholder — shows only honest, non-fabricated copy (§4).
 * Used by admin lists and public sections that have no content yet.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-8 text-center sm:p-10">
      <p className="text-sm font-medium text-slate-100">{title}</p>
      {description !== undefined && (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action !== undefined && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
