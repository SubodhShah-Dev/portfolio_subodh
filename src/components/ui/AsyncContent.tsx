import type { ReactNode } from "react";

import type { AppError, AsyncStatus } from "../../types/common";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { PageSkeleton } from "../common/Skeleton";

interface AsyncContentProps<T> {
  state: {
    data: T | null;
    status: AsyncStatus;
    error: AppError | null;
    reload: () => void;
  };
  children: (data: NonNullable<T>) => ReactNode;
  /** Shown while loading — defaults to the full-page skeleton (§44). */
  skeleton?: ReactNode;
  /** Shown when the result is empty; defaults to a plain empty card. */
  empty?: ReactNode;
  /** Custom error rendering; default shows the message and a Retry action. */
  errorFallback?: (error: AppError, retry: () => void) => ReactNode;
}

/**
 * Renders exactly one of loading / error / empty / ready from an
 * `AsyncResult` (§43), so every data-backed view behaves consistently:
 * failures never show stale data, and empty states are honest (§4).
 */
export function AsyncContent<T>({
  state,
  children,
  skeleton,
  empty,
  errorFallback,
}: AsyncContentProps<T>) {
  if (state.status === "loading" || state.status === "idle") {
    return <>{skeleton ?? <PageSkeleton />}</>;
  }

  if (state.status === "error") {
    const error = state.error;
    if (errorFallback !== undefined && error !== null) {
      return <>{errorFallback(error, state.reload)}</>;
    }
    return (
      <div role="alert" className="card space-y-4 p-8 text-center">
        <p className="text-sm font-medium text-slate-100">
          {error?.message ?? "Something went wrong while loading this content."}
        </p>
        <div className="flex justify-center">
          <Button variant="secondary" onClick={state.reload}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <>{empty ?? <EmptyState title="Nothing here yet" description="No content has been added." />}</>
    );
  }

  if (state.data === null) {
    return (
      <>{empty ?? <EmptyState title="Nothing here yet" description="No content has been added." />}</>
    );
  }

  return <>{children(state.data as NonNullable<T>)}</>;
}
