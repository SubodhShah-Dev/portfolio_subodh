import { describe, expect, it } from "vitest";

import {
  galleryUrlsError,
  isValidHttpUrl,
  parseImageLines,
  urlError,
} from "../../src/utils/urlValidation";

describe("isValidHttpUrl", () => {
  it("accepts https and http URLs", () => {
    expect(isValidHttpUrl("https://example.com/path?q=1")).toBe(true);
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects values that are not http(s) URLs", () => {
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
    expect(isValidHttpUrl("/relative/path")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("data:text/html,<script></script>")).toBe(false);
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
  });
});

describe("urlError", () => {
  it("returns null for empty optional values", () => {
    expect(urlError("")).toBeNull();
  });

  it("requires a value when configured to", () => {
    expect(urlError("", { required: true, label: "GitHub URL" })).toBe(
      "GitHub URL is required.",
    );
  });

  it("returns null for valid URLs", () => {
    expect(urlError("https://example.com", { required: true })).toBeNull();
  });

  it("returns a labeled message for invalid URLs", () => {
    expect(urlError("example.com", { required: true, label: "Live demo URL" })).toBe(
      "Live demo URL must be a valid http(s) URL.",
    );
  });
});

describe("parseImageLines", () => {
  it("splits one URL per line, trimming and dropping blanks", () => {
    expect(
      parseImageLines("  https://example.com/a.png \n\nhttps://example.com/b.png\r\n   "),
    ).toEqual(["https://example.com/a.png", "https://example.com/b.png"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseImageLines("")).toEqual([]);
    expect(parseImageLines("\n  \n")).toEqual([]);
  });
});

describe("galleryUrlsError", () => {
  it("accepts empty input and valid http(s) URLs", () => {
    expect(galleryUrlsError("")).toBeNull();
    expect(
      galleryUrlsError("https://example.com/1.png\nhttps://example.com/2.png"),
    ).toBeNull();
    expect(galleryUrlsError("\n   \nhttps://example.com/3.png")).toBeNull();
  });

  it("names the first invalid line", () => {
    expect(
      galleryUrlsError("https://example.com/ok.png\nnot-a-url"),
    ).toBe("Gallery image URL (line 2) must be a valid http(s) URL.");
  });

  it("rejects javascript: URLs", () => {
    expect(galleryUrlsError("javascript:alert(1)")).toBe(
      "Gallery image URL (line 1) must be a valid http(s) URL.",
    );
  });

  it("accepts a custom label for the same line format", () => {
    expect(galleryUrlsError("nope", "Profile image URL")).toBe(
      "Profile image URL (line 1) must be a valid http(s) URL.",
    );
  });
});
