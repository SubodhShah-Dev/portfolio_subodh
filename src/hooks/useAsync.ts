import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

import type { AppError, AsyncStatus } from "../types/common";
import { toAppError } from "../utils/firebaseErrors";

/**
 * Generic async data hook (§63).
 *
 * - Starts in `loading`, ends in `success` | `empty` | `error`.
 * - Re-runs when `deps` change or `reload()` is called.
 * - `deps` are caller-provided by design (they are the loader's inputs);
 *   the loader itself is kept in a ref so identity churn never refetches.
 * - Failed loads are never cached (retries must work).
 */
export interface AsyncResult<T> {
  data: T | null;
  status: AsyncStatus;
  error: AppError | null;
  reload: () => void;
}

export interface AsyncOptions<T> {
  /** Classifies a successful result as `empty` (e.g. zero-item arrays). */
  isEmpty?: (data: T) => boolean;
}

export function useAsync<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  options: AsyncOptions<T> = {},
): AsyncResult<T> {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    status: "loading" | "success" | "error";
    data: T | null;
    error: AppError | null;
  }>({ status: "loading", data: null, error: null });

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ status: "success", data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: "error", data: null, error: toAppError(error) });
      });
    return () => {
      active = false;
    };
    // Deps are the caller's loader inputs by design; the loader runs from a
    // ref so its identity does not belong in this list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    setVersion((current) => current + 1);
  }, []);

  let status: AsyncStatus = state.status;
  if (status === "success" && (state.data === null || (options.isEmpty?.(state.data) ?? false))) {
    status = "empty";
  }

  return { data: state.data, status, error: state.error, reload };
}
