import type { ChangeEvent } from "react";

import { FormField } from "../ui/FormField";

type FieldBase = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  required?: boolean;
  placeholder?: string;
};

function textProps(id: string, error?: string | null) {
  const hasError = error !== undefined && error !== null && error !== "";
  const describedBy = hasError ? `${id}-error` : undefined;
  return {
    id,
    className: "input",
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy,
  } as const;
}

/** Labeled single-line input built on FormField + `.input` (§49). */
export function TextField({
  label,
  id,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
}: FieldBase & {
  type?: string;
  autoComplete?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
}) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <input
        {...textProps(id, error)}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

/** Labeled multi-line textarea (§49). */
export function TextAreaField({
  label,
  id,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  rows = 5,
}: FieldBase & { rows?: number }) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <textarea
        {...textProps(id, error)}
        value={value}
        rows={rows}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Labeled native select (§54 — native control, keyboard accessible). */
export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  error,
  hint,
  required,
}: FieldBase & { options: SelectOption[] }) {
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <select
        {...textProps(id, error)}
        value={value}
        required={required}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

/** Labeled checkbox with an optional hint (§54 — visible label, no toggle hacks). */
export function CheckboxField({
  label,
  id,
  checked,
  onChange,
  hint,
}: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-300">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-emerald-500"
        />
        <span>{label}</span>
      </label>
      {hint !== undefined && (
        <p id={`${id}-hint`} className="mt-1 pl-6 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
