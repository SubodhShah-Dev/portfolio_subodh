import type { AppError, AppErrorCode } from "../types/common";

/**
 * Firebase error normalization (§45).
 *
 * Raw Firebase exceptions are never rendered. Every failure is mapped to a
 * stable application code plus a safe, human-readable message. The original
 * error is preserved on `cause` for admin-side diagnostics only.
 */

const PUBLIC_MESSAGES: Record<AppErrorCode, string> = {
  unknown: "Something went wrong. Please try again.",
  unauthenticated: "Your session has expired. Please sign in again.",
  "permission-denied": "You do not have permission to perform this action.",
  "not-found": "The requested item could not be found.",
  "invalid-input": "Please review the highlighted fields and try again.",
  network: "A network error occurred. Check your connection and try again.",
  unavailable: "The service is temporarily unavailable. Please try again.",
  quota: "Too many requests. Please wait a moment and try again.",
  "storage-unavailable":
    "File storage is currently unavailable. You can use an external link instead.",
  aborted: "The operation was cancelled.",
};

const FIREBASE_CODE_MAP: Record<string, AppErrorCode> = {
  // Firebase Auth
  "auth/unauthenticated": "unauthenticated",
  "auth/invalid-credential": "unauthenticated",
  "auth/invalid-email": "invalid-input",
  "auth/missing-password": "invalid-input",
  "auth/user-disabled": "unauthenticated",
  "auth/user-not-found": "unauthenticated",
  "auth/wrong-password": "unauthenticated",
  "auth/too-many-requests": "quota",
  "auth/network-request-failed": "network",
  "auth/requires-recent-login": "unauthenticated",

  // Cloud Firestore
  "firestore/permission-denied": "permission-denied",
  "firestore/unauthenticated": "unauthenticated",
  "firestore/not-found": "not-found",
  "firestore/invalid-argument": "invalid-input",
  "firestore/failed-precondition": "invalid-input",
  "firestore/aborted": "aborted",
  "firestore/cancelled": "aborted",
  "firestore/deadline-exceeded": "unavailable",
  "firestore/unavailable": "unavailable",
  "firestore/resource-exhausted": "quota",
  "firestore/internal": "unknown",
  "network-request-failed": "network",

  // Cloud Storage (failures are surfaced neutrally — never plan assumptions)
  "storage/unauthorized": "permission-denied",
  "storage/unauthenticated": "unauthenticated",
  "storage/retry-limit-exceeded": "storage-unavailable",
  "storage/bucket-not-found": "storage-unavailable",
  "storage/project-not-found": "storage-unavailable",
  "storage/unknown": "storage-unavailable",
  "storage/internal-error": "storage-unavailable",
  "storage/canceled": "aborted",
  "storage/quota-exceeded": "quota",
  "storage/invalid-format": "invalid-input",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Extracts the raw Firebase error code (e.g. "auth/invalid-credential"), if any. */
export function getFirebaseCode(error: unknown): string | null {
  if (isRecord(error) && typeof error.code === "string") {
    return error.code;
  }
  return null;
}

export function isAppError(value: unknown): value is AppError {
  if (!isRecord(value)) return false;
  const { code, message } = value;
  return (
    typeof code === "string" &&
    typeof message === "string" &&
    Object.prototype.hasOwnProperty.call(PUBLIC_MESSAGES, code)
  );
}

/** Builds a safe, throwable AppError with a normalized message. */
export function createAppError(
  code: AppErrorCode,
  message?: string,
  cause?: unknown,
): AppError {
  const base = new Error(
    message ?? PUBLIC_MESSAGES[code],
    cause !== undefined ? { cause } : undefined,
  );
  return Object.assign(base, { code });
}

/** Converts any thrown value into a safe, normalized AppError. */
export function toAppError(error: unknown, context?: AppErrorCode): AppError {
  if (isAppError(error)) return error;

  const code = getFirebaseCode(error);
  const mapped: AppErrorCode =
    code !== null && FIREBASE_CODE_MAP[code] !== undefined
      ? FIREBASE_CODE_MAP[code]
      : (context ?? "unknown");

  return createAppError(mapped, PUBLIC_MESSAGES[mapped], error);
}

/** Safe message lookup for a known application code. */
export function errorMessageFor(code: AppErrorCode): string {
  return PUBLIC_MESSAGES[code];
}
