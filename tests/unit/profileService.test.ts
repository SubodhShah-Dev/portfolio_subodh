import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactProfileInput, PublicProfileInput } from "../../src/types/profile";

/**
 * Path-composition regression test.
 *
 * profileService historically passed "profile/public" as the *collection*
 * path plus "public" as the id, producing the invalid 3-segment reference
 * profile/public/public — a synchronous Firestore error that killed the
 * public layout loader before any network call. These tests lock the
 * collection/id split: collection "profile", ids "public" and "contact".
 */

const { db, docMock, getDocMock, setDocMock } = vi.hoisted(() => {
  const db = { name: "mock-firestore" };
  return {
    db,
    docMock: vi.fn((_database: unknown, ...segments: string[]) => ({
      path: segments.join("/"),
    })),
    getDocMock: vi.fn(),
    setDocMock: vi.fn(),
  };
});

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(),
  doc: docMock,
  getDoc: getDocMock,
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => "serverTimestamp"),
  setDoc: setDocMock,
  updateDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock("../../src/config/firebase", () => ({ db }));

import { clearCache } from "../../src/services/contentCache";
import { getProfile, updateProfile } from "../../src/services/profileService";

beforeEach(() => {
  clearCache();
  vi.clearAllMocks();
});

describe("profileService document paths", () => {
  it("reads both profile documents from the profile collection", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    const result = await getProfile();

    expect(result).toBeNull();
    expect(docMock).toHaveBeenCalledWith(db, "profile", "public");
    expect(docMock).toHaveBeenCalledWith(db, "profile", "contact");
    expect(docMock).not.toHaveBeenCalledWith(db, "profile/public", "public");
  });

  it("saves the public profile to profile/public", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    const input: PublicProfileInput = {
      name: "Ada Lovelace",
      role: "Engineer",
      headline: "Analytical engines and beyond",
      bio: "First programmer.",
    };
    await updateProfile(input);

    expect(docMock).toHaveBeenCalledTimes(1);
    expect(docMock).toHaveBeenCalledWith(db, "profile", "public");
    const reference = docMock.mock.results[0]?.value as { path: string };
    expect(reference.path).toBe("profile/public");
    expect(setDocMock).toHaveBeenCalledTimes(1);
    const [, payload, options] = setDocMock.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
      { merge: boolean },
    ];
    expect(payload).toMatchObject({ ...input, createdAt: "serverTimestamp" });
    expect(options).toEqual({ merge: true });
  });

  it("saves contact identity to profile/contact", async () => {
    getDocMock.mockResolvedValue({ exists: () => true });

    const input: ContactProfileInput = { email: "ada@example.com" };
    const { updateContactProfile } = await import(
      "../../src/services/profileService"
    );
    await updateContactProfile(input);

    expect(docMock).toHaveBeenCalledWith(db, "profile", "contact");
    const reference = docMock.mock.results[0]?.value as { path: string };
    expect(reference.path).toBe("profile/contact");
    const [, payload] = setDocMock.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(payload).toMatchObject(input);
    expect(payload).not.toHaveProperty("createdAt");
  });
});
