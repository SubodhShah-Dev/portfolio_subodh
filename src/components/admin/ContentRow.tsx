import { useId, type ReactNode } from "react";

import type { ContentStatus } from "../../types/common";
import { StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";

const STATUSES: ContentStatus[] = ["draft", "published", "archived"];

interface ContentRowProps {
  title: string;
  /** Secondary line — category, company, dates, whatever the entity shows. */
  meta?: ReactNode;
  status?: ContentStatus;
  onStatusChange?: (status: ContentStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Disabled while any mutation for this row is running (§43). */
  busy?: boolean;
  /** Disables the move buttons at the ends of the list. */
  isFirst?: boolean;
  isLast?: boolean;
  /** Extra actions rendered before Edit (e.g. expand toggles). */
  children?: ReactNode;
}

/**
 * One row in an admin content list: identity, status control, reorder,
 * edit, and delete — every control visible and labeled, none hover-only (§54).
 */
export function ContentRow({
  title,
  meta,
  status,
  onStatusChange,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  busy = false,
  isFirst = false,
  isLast = false,
  children,
}: ContentRowProps) {
  const statusId = useId();
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-slate-100">{title}</p>
          {status !== undefined && <StatusBadge status={status} />}
        </div>
        {meta !== undefined && <div className="mt-1 text-sm text-slate-500">{meta}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}
        {status !== undefined && onStatusChange !== undefined && (
          <label className="sr-only" htmlFor={statusId}>
            Status for {title}
          </label>
        )}
        {status !== undefined && onStatusChange !== undefined && (
          <select
            id={statusId}
            className="input w-auto min-w-28"
            value={status}
            disabled={busy}
            onChange={(event) => onStatusChange(event.target.value as ContentStatus)}
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
        {onMoveUp !== undefined && (
          <Button
            variant="secondary"
            aria-label={`Move ${title} up`}
            disabled={busy || isFirst}
            onClick={onMoveUp}
          >
            Up
          </Button>
        )}
        {onMoveDown !== undefined && (
          <Button
            variant="secondary"
            aria-label={`Move ${title} down`}
            disabled={busy || isLast}
            onClick={onMoveDown}
          >
            Down
          </Button>
        )}
        {onEdit !== undefined && (
          <Button variant="secondary" onClick={onEdit} disabled={busy}>
            Edit
          </Button>
        )}
        {onDelete !== undefined && (
          <Button variant="danger" onClick={onDelete} disabled={busy}>
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}
