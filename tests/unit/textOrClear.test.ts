import { deleteField } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { textOrClear } from "../../src/services/serviceUtils";

/**
 * Clearing an optional field must produce `deleteField()` — `setDoc(…,
 * { merge: true })` never removes keys that are simply absent from the
 * payload, so a cleared value that is omitted leaves the old data behind.
 */
describe("textOrClear", () => {
  it("returns the trimmed string for non-blank values", () => {
    expect(textOrClear("hello")).toBe("hello");
    expect(textOrClear("  hello  ")).toBe("hello");
  });

  it("returns a field deletion for blank values", () => {
    expect(textOrClear("")).toEqual(deleteField());
    expect(textOrClear("   ")).toEqual(deleteField());
    expect(textOrClear("")).not.toBeTypeOf("string");
  });
});
