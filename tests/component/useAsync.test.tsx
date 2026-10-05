import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsync } from "../../src/hooks/useAsync";
import { createAppError } from "../../src/utils/firebaseErrors";

describe("useAsync", () => {
  it("starts loading and resolves to success with data", async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve("payload"), []));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toBe("payload");
    expect(result.current.error).toBeNull();
  });

  it("classifies empty arrays as empty", async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve([] as number[]), [], { isEmpty: (items) => items.length === 0 }),
    );

    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(result.current.data).toEqual([]);
  });

  it("classifies a null result as empty", async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(null as string | null), []));

    await waitFor(() => expect(result.current.status).toBe("empty"));
  });

  it("normalizes thrown values into an AppError", async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(createAppError("network", "Connection lost.")), []),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("network");
    expect(result.current.error?.message).toBe("Connection lost.");
  });

  it("refetches on reload", async () => {
    const loader = vi.fn(() => Promise.resolve(Math.random()));
    const { result } = renderHook(() => useAsync(loader, []));
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.reload();
    });
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("refetches when dependencies change", async () => {
    const loader = vi.fn((id: number) => Promise.resolve(id));
    const { result, rerender } = renderHook(({ id }) => useAsync(() => loader(id), [id]), {
      initialProps: { id: 1 },
    });

    await waitFor(() => expect(result.current.data).toBe(1));
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toBe(2));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
