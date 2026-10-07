/**
 * URL validation (§65).
 *
 * Only http(s) URLs are accepted — javascript:, data:, and relative values
 * are rejected. No default or example URLs are ever produced: invalid input
 * returns an error message, never a substitute value.
 */

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export interface UrlErrorOptions {
  required?: boolean;
  label?: string;
}

/** Returns an error message for invalid input, or null when acceptable. */
export function urlError(value: string, options: UrlErrorOptions = {}): string | null {
  const label = options.label ?? "URL";
  const trimmed = value.trim();

  if (trimmed === "") {
    return options.required === true ? `${label} is required.` : null;
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

/** First invalid non-empty gallery line as a message, or null when all pass. */
export function galleryUrlsError(value: string): string | null {
  const lines = value.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || line.trim() === "") continue;
    const error = urlError(line, {
      label: `Gallery image URL (line ${index + 1})`,
    });
    if (error !== null) return error;
  }
  return null;
}
