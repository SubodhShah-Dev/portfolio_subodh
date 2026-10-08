import { describe, expect, it } from "vitest";

import { resolveProfileImages } from "../../src/utils/profileImages";

describe("resolveProfileImages", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(resolveProfileImages({})).toEqual([]);
    expect(resolveProfileImages({ profileImageUrl: "   " })).toEqual([]);
    expect(resolveProfileImages({ profileImageUrls: [] })).toEqual([]);
    expect(resolveProfileImages({ profileImageUrls: ["", "  "] })).toEqual([]);
  });

  it("falls back to the legacy single profile image", () => {
    expect(
      resolveProfileImages({ profileImageUrl: "https://example.com/a.jpg" }),
    ).toEqual(["https://example.com/a.jpg"]);
  });

  it("prefers the deck and keeps order, trimming and de-duplicating", () => {
    expect(
      resolveProfileImages({
        profileImageUrls: [
          " https://example.com/a.jpg ",
          "https://example.com/b.jpg",
          "https://example.com/a.jpg",
          "",
        ],
        profileImageUrl: "https://example.com/c.jpg",
      }),
    ).toEqual([
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
      "https://example.com/c.jpg",
    ]);
  });

  it("appends the legacy url only when it is not already in the deck", () => {
    expect(
      resolveProfileImages({
        profileImageUrls: ["https://example.com/a.jpg"],
        profileImageUrl: "https://example.com/a.jpg",
      }),
    ).toEqual(["https://example.com/a.jpg"]);
  });
});
