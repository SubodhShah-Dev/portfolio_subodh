/**
 * URL validation (§65).
 *
 * Only http(s) URLs are accepted — javascript:, data:, and relative values
 * are rejected. Fields that point at assets under `public/` opt in with
 * `allowLocal`, which additionally accepts root-relative paths served by the
 * app itself (`/brand/logo.png`). No default or example URLs are ever
 * produced: invalid input returns an error message, never a substitute value.
 */

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Root-relative path to a file served from `public/`: starts with a single
 * `/` (length > 1). Protocol-relative `//host` and backslash prefixes are
 * rejected so a local value can never point off-origin.
 */
export function isLocalPath(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length <= 1 || !trimmed.startsWith("/")) return false;
  const second = trimmed[1];
  return second !== "/" && second !== "\\";
}

export interface UrlErrorOptions {
  required?: boolean;
  label?: string;
  /** Accept root-relative paths (e.g. `/brand/logo.png`) alongside http(s). */
  allowLocal?: boolean;
}

/** Returns an error message for invalid input, or null when acceptable. */
export function urlError(value: string, options: UrlErrorOptions = {}): string | null {
  const label = options.label ?? "URL";
  const trimmed = value.trim();

  if (trimmed === "") {
    return options.required === true ? `${label} is required.` : null;
  }

  if (options.allowLocal === true && isLocalPath(trimmed)) {
    return null;
  }

  if (!isValidHttpUrl(trimmed)) {
    return `${label} must be a valid http(s) URL.`;
  }

  return null;
}

/** Split a textarea into one-URL-per-line entries (trimmed, non-empty). */
export function parseImageLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** First invalid non-empty line as a message, or null when all pass. */
export function galleryUrlsError(
  value: string,
  label = "Gallery image URL",
  options: Omit<UrlErrorOptions, "label"> = {},
): string | null {
  const lines = value.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || line.trim() === "") continue;
    const error = urlError(line, {
      ...options,
      label: `${label} (line ${index + 1})`,
    });
    if (error !== null) return error;
  }
  return null;
}
