import type { ReactNode } from "react";

interface AdminPageShellProps {
  title: string;
  description?: string;
  /** Page-level actions (e.g. "New project" button), top-right. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Consistent admin page header + body wrapper (§61, §64).
 * One screen per management page: header, actions, list/editor content.
 */
export default function AdminPageShell({
  title,
  description,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
          {description !== undefined && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {actions !== undefined && <div className="flex flex-wrap gap-3">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
