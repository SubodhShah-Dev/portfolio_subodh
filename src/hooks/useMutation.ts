import { useCallback, useEffect, useRef, useState } from "react";

import type { AppError, MutationStatus } from "../types/common";
import { createAppError, toAppError } from "../utils/firebaseErrors";

/**
 * Mutation wrapper (§43, §63): exposes a discriminated result so callers
 * can branch without try/catch, plus a status for button states.
 *
 * - Never throws — errors surface as `{ ok: false, error }` (normalized).
 * - Rejects duplicate submissions while one is in flight.
 * - Runs from a ref so inline functions never cause re-subscription.
 */
export type MutationResult<T> = { ok: true; data: T } | { ok: false; error: AppError };

export interface Mutation<A, T> {
  execute: (args: A) => Promise<MutationResult<T>>;
  status: MutationStatus;
  error: AppError | null;
  reset: () => void;
}

export function useMutation<A, T>(fn: (args: A) => Promise<T>): Mutation<A, T> {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const [status, setStatus] = useState<MutationStatus>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const inFlight = useRef(false);

  const execute = useCallback(async (args: A): Promise<MutationResult<T>> => {
    if (inFlight.current) {
      return {
        ok: false,
        error: createAppError("aborted", "Please wait — the previous submission is still processing."),
      };
    }
    inFlight.current = true;
    setStatus("submitting");
    setError(null);
    try {
      const data = await fnRef.current(args);
      setStatus("success");
      return { ok: true, data };
    } catch (raw) {
      const appError = toAppError(raw);
      setStatus("error");
      setError(appError);
      return { ok: false, error: appError };
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { execute, status, error, reset };
}
