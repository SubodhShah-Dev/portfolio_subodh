import type { Timestamp } from "firebase/firestore";

/** Publication lifecycle for all portfolio content (§11). */
export type ContentStatus = "draft" | "published" | "archived";

export const CONTENT_STATUSES: readonly ContentStatus[] = ["draft", "published", "archived"];

/** Normalized application error codes — raw Firebase errors never reach the UI. */
export type AppErrorCode =
  | "unknown"
  | "unauthenticated"
  | "permission-denied"
  | "not-found"
  | "invalid-input"
  | "network"
  | "unavailable"
  | "quota"
  | "storage-unavailable"
  | "aborted";

/**
 * Normalized application error — raw Firebase exceptions never reach the UI.
 * Extends Error so it can be safely thrown; `cause` preserves the original
 * exception for admin-side diagnostics (never shown to public users).
 */
export interface AppError extends Error {
  code: AppErrorCode;
}

/** Read lifecycle: idle → loading → success | error | empty (§43). */
export type AsyncStatus = "idle" | "loading" | "success" | "error" | "empty";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: AppError | null;
}

/** Mutation lifecycle: idle → submitting → success | error (§43). */
export type MutationStatus = "idle" | "submitting" | "success" | "error";

export interface MutationState {
  status: MutationStatus;
  error: AppError | null;
}

/** Minimal shape shared by every timestamped portfolio document (§29). */
export interface Timestamped {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

/** Ordered, status-managed content shared by listable collections (§49). */
export interface OrderedContent extends Timestamped {
  status: ContentStatus;
  order: number;
}

/** Administrator record — created manually, never client-writable (§32). */
export interface AdminRecord {
  id: string;
  role: "admin";
}
