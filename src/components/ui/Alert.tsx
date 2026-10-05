import type { ReactNode } from "react";

export type AlertTone = "error" | "success" | "info";

const TONES: Record<AlertTone, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  /** Optional inline dismiss control for transient confirmations. */
  onDismiss?: () => void;
  children: ReactNode;
}

/**
 * Inline message banner (§43). Errors and successes are announced via
 * role="alert"/status — never color alone (§54).
 */
export function Alert({ tone = "info", title, onDismiss, children }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}
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
          className="-m-1 shrink-0 cursor-pointer rounded p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
