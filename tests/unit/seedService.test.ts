import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Seeder contract: refuses to touch a non-empty site (no overwrites, no
 * duplicates), and on an empty site writes the full sample portfolio in one
 * batch with unique fixed ids and rule-compliant payloads.
 */

const { db, docMock, getDocMock, getDocsMock, writeBatchMock, setMock, commitMock } =
  vi.hoisted(() => {
    const db = { name: "mock-firestore" };
    const setMock = vi.fn();
    const commitMock = vi.fn(() => Promise.resolve());
    return {
      db,
      docMock: vi.fn((_database: unknown, ...segments: string[]) => ({
        path: segments.join("/"),
      })),
      getDocMock: vi.fn(),
      getDocsMock: vi.fn(),
      writeBatchMock: vi.fn(() => ({ set: setMock, commit: commitMock })),
      setMock,
      commitMock,
    };
  });

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_database: unknown, path: string) => ({ path })),
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  query: vi.fn((reference: unknown) => reference),
  serverTimestamp: vi.fn(() => "serverTimestamp"),
  writeBatch: writeBatchMock,
}));

vi.mock("../../src/config/firebase", () => ({ db }));

import { cached, clearCache } from "../../src/services/contentCache";
import { seedDemoData, SEED_COUNTS } from "../../src/services/seedService";

function mockEmptySite(): void {
  getDocMock.mockImplementation(() => Promise.resolve({ exists: () => false }));
  getDocsMock.mockImplementation(() => Promise.resolve({ empty: true, size: 0 }));
}

beforeEach(() => {
  clearCache();
  vi.clearAllMocks();
  mockEmptySite();
});

describe("seedDemoData", () => {
  it("refuses to seed when the profile already exists", async () => {
    getDocMock.mockImplementation((reference: { path: string }) =>
      Promise.resolve({
        exists: () => reference.path === "profile/public",
      }),
    );

    await expect(seedDemoData()).rejects.toMatchObject({ code: "invalid-input" });
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it("refuses to seed when skills already exist", async () => {
    getDocsMock.mockImplementation((reference: { path: string }) =>
      Promise.resolve({
        empty: reference.path !== "skills",
        size: reference.path === "skills" ? 3 : 0,
      }),
    );

    await expect(seedDemoData()).rejects.toMatchObject({ code: "invalid-input" });
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it("writes the full sample portfolio in one batch with unique ids", async () => {
    await seedDemoData();

    expect(writeBatchMock).toHaveBeenCalledTimes(1);
    expect(commitMock).toHaveBeenCalledTimes(1);

    const paths = setMock.mock.calls.map(
      ([reference]) => (reference as { path: string }).path,
    );
    const expected = 2 + SEED_COUNTS.skills + SEED_COUNTS.projects + 2;
    expect(paths).toHaveLength(expected);
    expect(new Set(paths).size).toBe(expected);

    expect(paths).toContain("profile/public");
    expect(paths).toContain("profile/contact");
    expect(paths).toContain("settings/main");
    expect(paths).toContain("contact/main");
    expect(paths).toContain("skills/typescript");
    expect(paths).toContain("projects/devboard");

    const skillPayload = setMock.mock.calls.find(
      ([reference]) => (reference as { path: string }).path === "skills/typescript",
    )?.[1] as Record<string, unknown>;
    expect(skillPayload).toMatchObject({
      name: "TypeScript",
      category: "Languages",
      status: "published",
      order: 0,
      createdAt: "serverTimestamp",
      updatedAt: "serverTimestamp",
      publishedAt: "serverTimestamp",
    });

    const skillOrders = setMock.mock.calls
      .filter(([reference]) => (reference as { path: string }).path.startsWith("skills/"))
      .map(([, payload]) => (payload as { order: number }).order);
    expect(skillOrders).toEqual([...skillOrders].sort((a, b) => a - b));
    expect(new Set(skillOrders).size).toBe(SEED_COUNTS.skills);

    const settingsPayload = setMock.mock.calls.find(
      ([reference]) => (reference as { path: string }).path === "settings/main",
    )?.[1] as Record<string, unknown>;
    expect(settingsPayload.enabled).toBe(true);
    expect(settingsPayload.sections).toMatchObject({ hero: true, contact: true });
  });

  it("invalidates cached reads so the public site picks up the data", async () => {
    let loads = 0;
    await cached("profile:combined", () => {
      loads += 1;
      return Promise.resolve(null);
    });

    await seedDemoData();

    await cached("profile:combined", () => {
      loads += 1;
      return Promise.resolve("fresh");
    });
    expect(loads).toBe(2);
  });
});
