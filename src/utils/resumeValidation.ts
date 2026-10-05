/**
 * Resume file validation (§24).
 *
 * Only real files pass: non-empty PDFs within the 10 MB limit. Type is
 * checked from MIME when present, falling back to the file extension when
 * the browser reports none.
 */

export const RESUME_MAX_BYTES = 10 * 1024 * 1024;
export const RESUME_MAX_LABEL = "10 MB";

/** Returns an error message, or null when the file is acceptable. */
export function validateResumeFile(file: File): string | null {
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > RESUME_MAX_BYTES) {
    return `Resume files must be ${RESUME_MAX_LABEL} or smaller.`;
  }

  const looksLikePdf =
    file.type === "application/pdf" ||
    (file.type === "" && file.name.toLowerCase().endsWith(".pdf"));
  if (!looksLikePdf) {
    return "Only PDF files can be uploaded.";
  }
  return null;
}
