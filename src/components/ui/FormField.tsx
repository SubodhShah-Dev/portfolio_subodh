import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  /** Must match the id of the control rendered in `children`. */
  htmlFor: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  /**
   * Visual tone: "dark" (Carbon Dark admin, default) or "light"
   * (Signal public form). Semantics and ids never change.
   */
  variant?: "dark" | "light";
  children: ReactNode;
}

/**
 * Label + control wrapper (§49). Errors render with role="alert" and use the
 * stable ids `${htmlFor}-hint` / `${htmlFor}-error` so controls can reference
 * them via aria-describedby.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  variant = "dark",
  children,
}: FormFieldProps) {
  const showError = error !== undefined && error !== null && error !== "";
  const light = variant === "light";
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={
          light
            ? "mb-2 block font-meta text-[0.6875rem] tracking-[0.14em] text-muted uppercase"
            : "mb-1.5 block text-sm font-medium text-slate-300"
        }
      >
        {label}
        {required && (
          <span
            className={`ml-1 ${light ? "text-signal-deep" : "text-emerald-400"}`}
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      {children}
      {showError ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className={`mt-1.5 text-xs ${light ? "text-error" : "text-red-400"}`}
        >
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p
            id={`${htmlFor}-hint`}
            className={`mt-1.5 text-xs ${light ? "text-muted" : "text-slate-500"}`}
          >
            {hint}
          </p>
        )
      )}
    </div>
  );
}
