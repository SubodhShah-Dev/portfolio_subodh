import { beforeEach, describe, expect, it, vi } from "vitest";

import { cached, clearCache, invalidateCache } from "../../src/services/contentCache";

describe("cached", () => {
  beforeEach(() => {
    clearCache();
  });

  it("deduplicates concurrent loads into one underlying read", async () => {
    const loader = vi.fn(() => Promise.resolve("value"));
    const [first, second] = await Promise.all([
      cached("dedupe", loader),
      cached("dedupe", loader),
    ]);
    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("serves cached values within the TTL and reloads after expiry", async () => {
    vi.useFakeTimers();
    try {
      const loader = vi.fn(() => Promise.resolve("value"));
      await cached("ttl", loader, 1_000);
      vi.advanceTimersByTime(999);
      await cached("ttl", loader, 1_000);
      expect(loader).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2);
      await cached("ttl", loader, 1_000);
      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never caches failures so retries can succeed", async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(cached("retry", loader)).rejects.toThrow("boom");
    await expect(cached("retry", loader)).resolves.toBe("recovered");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateCache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("clears exact, colon-prefixed, and slash-prefixed keys", async () => {
    await cached("projects", () => Promise.resolve("a"));
    await cached("projects:published", () => Promise.resolve("b"));
    await cached("projects/byId:1", () => Promise.resolve("c"));
    await cached("skills:published", () => Promise.resolve("d"));

    invalidateCache("projects");

    const loader = vi.fn(() => Promise.resolve("fresh"));
    await cached("projects", loader);
    await cached("projects:published", loader);
    await cached("projects/byId:1", loader);
    await cached("skills:published", loader);

    expect(loader).toHaveBeenCalledTimes(3);
  });

  it("does not clear keys that merely start with the same characters", async () => {
    const preserved = vi.fn(() => Promise.resolve("preserved"));
    await cached("skills:published", preserved);

    invalidateCache("skill");

    await cached("skills:published", preserved);
    expect(preserved).toHaveBeenCalledTimes(1);
  });
});

describe("clearCache", () => {
  it("drops every entry", async () => {
    await cached("a", () => Promise.resolve("1"));
    await cached("b", () => Promise.resolve("2"));
    clearCache();
    const loader = vi.fn(() => Promise.resolve("fresh"));
    await cached("a", loader);
    await cached("b", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
