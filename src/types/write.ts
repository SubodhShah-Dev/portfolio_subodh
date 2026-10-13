import type { FieldValue } from "firebase/firestore";

/**
 * Write-side input types (§62).
 *
 * Forms round-trip optional text fields as empty strings, but Firestore only
 * removes a field when the write explicitly asks for it (`deleteField()`).
 * `Clearable` widens the *optional string* props of an input type so callers
 * can pass `textOrClear()` results; required and non-string props stay strict.
 */
export type Clearable<T> = {
  [K in keyof T]: undefined extends T[K] ? T[K] | FieldValue : T[K];
};
