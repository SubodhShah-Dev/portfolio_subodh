import type { ReactNode } from "react";
import { X } from "lucide-react";

export type AlertTone = "error" | "success" | "info";
export type AlertVariant = "dark" | "light";

const TONES: Record<AlertTone, Record<AlertVariant, string>> = {
  error: {
    dark: "border-red-500/30 bg-red-500/10 text-red-300",
    light: "border-error/40 bg-error-tint text-ink",
  },
  success: {
    dark: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    light: "border-success/40 bg-success-tint text-ink",
  },
  info: {
    dark: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    light: "border-hairline bg-raised text-ink",
  },
};

interface AlertProps {
  tone?: AlertTone;
  /** Visual tone: "dark" (admin, default) or "light" (public). */
  variant?: AlertVariant;
  title?: string;
  /** Optional inline dismiss control for transient confirmations. */
  onDismiss?: () => void;
  children: ReactNode;
}

/**
 * Inline message banner (§43). Errors and successes are announced via
 * role="alert"/status — never color alone (§54).
 */
export function Alert({
  tone = "error",
  variant = "dark",
  title,
  onDismiss,
  children,
}: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`flex items-start justify-between gap-4 border px-4 py-3 text-sm ${
        TONES[tone][variant]
      }`}
    >
      <div>
        {title !== undefined && <p className="font-medium">{title}</p>}
        <div className={title !== undefined ? "mt-0.5 text-sm opacity-90" : ""}>{children}</div>
      </div>
      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-m-1 shrink-0 cursor-pointer p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
