import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMutation, type MutationResult } from "../../src/hooks/useMutation";
import { createAppError } from "../../src/utils/firebaseErrors";

describe("useMutation", () => {
  it("returns a discriminated success result and tracks status", async () => {
    const { result } = renderHook(() => useMutation((value: number) => Promise.resolve(value * 2)));
    expect(result.current.status).toBe("idle");

    let outcome: MutationResult<number> | undefined;
    await act(async () => {
      outcome = await result.current.execute(21);
    });

    expect(outcome).toEqual({ ok: true, data: 42 });
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("never throws — errors surface as normalized AppErrors", async () => {
    const { result } = renderHook(() =>
      useMutation(() => Promise.reject(createAppError("permission-denied", "Not allowed."))),
    );

    let outcome: MutationResult<never> | undefined;
    await act(async () => {
      outcome = await result.current.execute(undefined);
    });

    expect(outcome?.ok).toBe(false);
    if (outcome !== undefined && !outcome.ok) {
      expect(outcome.error.code).toBe("permission-denied");
    }
    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("Not allowed.");
  });

  it("rejects duplicate submissions while one is in flight", async () => {
    let resolveFirst!: (value: string) => void;
    const fn = vi.fn(
      (_id: string) =>
        new Promise<string>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { result } = renderHook(() => useMutation(fn));

    let firstOutcome: MutationResult<string> | undefined;
    let duplicateOutcome: MutationResult<string> | undefined;
    await act(async () => {
      const first = result.current.execute("a");
      duplicateOutcome = await result.current.execute("b");
      resolveFirst("done");
      firstOutcome = await first;
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(firstOutcome?.ok).toBe(true);
    expect(duplicateOutcome?.ok).toBe(false);
    if (duplicateOutcome !== undefined && !duplicateOutcome.ok) {
      expect(duplicateOutcome.error.code).toBe("aborted");
    }
  });

  it("resets back to idle", async () => {
    const { result } = renderHook(() =>
      useMutation(() => Promise.reject(createAppError("unknown"))),
    );

    await act(async () => {
      await result.current.execute(undefined);
    });
    expect(result.current.status).toBe("error");

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });
});
