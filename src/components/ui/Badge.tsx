import type { ReactNode } from "react";

import type { ContentStatus } from "../../types/common";

export type BadgeTone = "emerald" | "amber" | "slate" | "red" | "sky";

const TONES: Record<BadgeTone, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  slate: "border-slate-700 bg-slate-800 text-slate-400",
  red: "border-red-500/30 bg-red-500/10 text-red-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** Small pill for statuses, counts, and categories (§56). */
export function Badge({ tone = "slate", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<ContentStatus, BadgeTone> = {
  published: "emerald",
  draft: "amber",
  archived: "slate",
};

/** Publication-state badge used across admin lists (§11). */
export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{status}</Badge>;
}
