import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  /** Must match the id of the control rendered in `children`. */
  htmlFor: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
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
  children,
}: FormFieldProps) {
  const showError = error !== undefined && error !== null && error !== "";
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
        {required && (
          <span className="ml-1 text-emerald-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {showError ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
