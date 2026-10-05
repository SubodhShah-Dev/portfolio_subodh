/**
 * Generic form validation primitives (§40, §64).
 *
 * Validators return an error message or null. They never mutate input and
 * never substitute fabricated values.
 */

export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

export function isValidEmail(value: string): boolean {
  // Pragmatic pattern: local@domain.tld with no whitespace.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function requiredError(label: string, value: string | null | undefined): string | null {
  return isBlank(value) ? `${label} is required.` : null;
}

export function emailError(label: string, value: string): string | null {
  const required = requiredError(label, value);
  if (required !== null) return required;
  return isValidEmail(value) ? null : `${label} must be a valid email address.`;
}

export function maxLengthError(
  label: string,
  value: string,
  max: number,
): string | null {
  return value.length > max ? `${label} must be ${max} characters or fewer.` : null;
}

export function minLengthError(
  label: string,
  value: string,
  min: number,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null; // optional fields pass silently
  return trimmed.length < min
    ? `${label} must be at least ${min} characters.`
    : null;
}

/** First non-null error, or null when every check passed. */
export function firstError(...errors: (string | null)[]): string | null {
  for (const error of errors) {
    if (error !== null) return error;
  }
  return null;
}

/**
 * Splits a comma/newline separated list into trimmed, non-empty entries.
 * Used for tech stack, features, and technologies fields.
 */
export function parseList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

/** Inverse of parseList for editing multi-value fields as text. */
export function joinList(values: readonly string[]): string {
  return values.join(", ");
}

/** Filters nulls out of a per-field error map, keeping only real messages. */
export function fieldErrors(
  entries: Record<string, string | null>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).filter(
      (entry): entry is [string, string] => entry[1] !== null,
    ),
  );
}
