import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Seeder contract: fill-missing (never overwrites existing documents,
 * idempotent — errors only when every sample entry is already in place),
 * and on an empty site writes the full sample portfolio in one batch with
 * unique fixed ids and rule-compliant payloads.
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
import {
  seedDemoData,
  SEED_COUNTS,
  SEED_PROJECT_IDS,
  SEED_SKILL_IDS,
} from "../../src/services/seedService";

function mockEmptySite(): void {
  getDocMock.mockImplementation(() => Promise.resolve({ exists: () => false }));
  getDocsMock.mockImplementation(() =>
    Promise.resolve({ empty: true, size: 0, docs: [] }),
  );
}

/** getDoc answers exist/not-exist per document path. */
function mockDocState(existsByPath: Record<string, boolean>): void {
  getDocMock.mockImplementation((reference: { path: string }) =>
    Promise.resolve({ exists: () => existsByPath[reference.path] ?? false }),
  );
}

/** getDocs answers a document id list per collection path. */
function mockCollectionState(byPath: Record<string, readonly string[]>): void {
  getDocsMock.mockImplementation((reference: { path: string }) => {
    const ids = byPath[reference.path] ?? [];
    return Promise.resolve({
      docs: ids.map((id) => ({ id })),
      size: ids.length,
      empty: ids.length === 0,
    });
  });
}

function writtenPaths(): string[] {
  return setMock.mock.calls.map(([reference]) => (reference as { path: string }).path);
}

beforeEach(() => {
  clearCache();
  vi.clearAllMocks();
  mockEmptySite();
});

describe("seedDemoData", () => {
  it("skips existing documents and never overwrites them", async () => {
    mockDocState({
      "profile/public": true,
      "profile/contact": true,
      "settings/main": false,
      "contact/main": true,
    });
    mockCollectionState({ skills: ["typescript", "javascript"], projects: ["devboard"] });

    const result = await seedDemoData();

    const paths = writtenPaths();
    expect(paths).not.toContain("profile/public");
    expect(paths).not.toContain("profile/contact");
    expect(paths).not.toContain("contact/main");
    expect(paths).not.toContain("skills/typescript");
    expect(paths).not.toContain("projects/devboard");
    expect(paths).toContain("settings/main");
    expect(paths).toContain("skills/css");
    expect(paths).toContain("projects/invoicekit");

    expect(result.skipped).toEqual(
      expect.arrayContaining([
        "profile",
        "profile contact",
        "contact",
        "skill: TypeScript",
        "skill: JavaScript",
        "project: DevBoard",
      ]),
    );
    expect(result.filled).toEqual(expect.arrayContaining(["settings", "skill: CSS"]));

    // New skills append after the two existing entries — no order collisions.
    const skillOrders = paths
      .filter((path) => path.startsWith("skills/"))
      .map(
        (path) =>
          setMock.mock.calls.find(([ref]) => (ref as { path: string }).path === path)?.[1] as Record<
            string,
            unknown
          >,
      )
      .map((payload) => (payload as { order: number }).order);
    expect(Math.min(...skillOrders)).toBe(2);
    expect(new Set(skillOrders).size).toBe(skillOrders.length);
  });

  it("errors without any writes when every sample entry already exists", async () => {
    mockDocState({
      "profile/public": true,
      "profile/contact": true,
      "settings/main": true,
      "contact/main": true,
    });
    mockCollectionState({ skills: SEED_SKILL_IDS, projects: SEED_PROJECT_IDS });

    await expect(seedDemoData()).rejects.toMatchObject({ code: "invalid-input" });
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it("is idempotent — a second run on a seeded site adds nothing", async () => {
    await seedDemoData();
    expect(writeBatchMock).toHaveBeenCalledTimes(1);

    mockDocState({
      "profile/public": true,
      "profile/contact": true,
      "settings/main": true,
      "contact/main": true,
    });
    mockCollectionState({ skills: SEED_SKILL_IDS, projects: SEED_PROJECT_IDS });

    await expect(seedDemoData()).rejects.toMatchObject({ code: "invalid-input" });
    expect(writeBatchMock).toHaveBeenCalledTimes(1);
  });

  it("writes the full sample portfolio in one batch with unique ids", async () => {
    const result = await seedDemoData();

    expect(writeBatchMock).toHaveBeenCalledTimes(1);
    expect(commitMock).toHaveBeenCalledTimes(1);

    const paths = writtenPaths();
    const expected = 2 + SEED_COUNTS.skills + SEED_COUNTS.projects + 2;
    expect(paths).toHaveLength(expected);
    expect(new Set(paths).size).toBe(expected);
    expect(result.filled).toHaveLength(expected);
    expect(result.skipped).toHaveLength(0);

    expect(paths).toContain("profile/public");
    expect(paths).toContain("profile/contact");
    expect(paths).toContain("settings/main");
    expect(paths).toContain("contact/main");
    expect(paths).toContain("skills/typescript");
    expect(paths).toContain("projects/devboard");

    const profilePayload = setMock.mock.calls.find(
      ([reference]) => (reference as { path: string }).path === "profile/public",
    )?.[1] as Record<string, unknown>;
    expect(profilePayload.profileImageUrl).toMatch(/^https:\/\/picsum\.photos\//);

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
