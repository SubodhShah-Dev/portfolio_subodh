import { describe, expect, it } from "vitest";

import {
  galleryUrlsError,
  isLocalPath,
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

  it("rejects local paths unless allowLocal is set", () => {
    expect(urlError("/brand/logo.png")).toBe(
      "URL must be a valid http(s) URL.",
    );
    expect(urlError("/brand/logo.png", { allowLocal: true })).toBeNull();
    expect(urlError("/about/1.jpg?width=600", { allowLocal: true })).toBeNull();
    expect(
      urlError("/brand/logo.png", { required: true, allowLocal: true }),
    ).toBeNull();
  });

  it("still rejects off-origin and unsafe values when allowLocal is set", () => {
    expect(urlError("//evil.com/x.png", { allowLocal: true })).toBe(
      "URL must be a valid http(s) URL.",
    );
    expect(urlError("/\\evil.com", { allowLocal: true })).toBe(
      "URL must be a valid http(s) URL.",
    );
    expect(urlError("/", { allowLocal: true })).toBe(
      "URL must be a valid http(s) URL.",
    );
    expect(urlError("javascript:alert(1)", { allowLocal: true })).toBe(
      "URL must be a valid http(s) URL.",
    );
    expect(
      urlError("https://example.com/a.png", { allowLocal: true }),
    ).toBeNull();
  });
});

describe("isLocalPath", () => {
  it("accepts root-relative paths deeper than the site root", () => {
    expect(isLocalPath("/brand/logo.svg")).toBe(true);
    expect(isLocalPath("/favicon.svg")).toBe(true);
    expect(isLocalPath("  /about/1.jpg  ")).toBe(true);
  });

  it("rejects bare root, relative, protocol-relative, and backslash values", () => {
    expect(isLocalPath("/")).toBe(false);
    expect(isLocalPath("about/1.jpg")).toBe(false);
    expect(isLocalPath("//cdn.example.com/x.png")).toBe(false);
    expect(isLocalPath("/\\cdn.example.com")).toBe(false);
    expect(isLocalPath("")).toBe(false);
    expect(isLocalPath("https://example.com/x.png")).toBe(false);
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

  it("accepts local paths per line when allowLocal is set", () => {
    expect(
      galleryUrlsError(
        "/about/1.jpg\n/about/2.jpg\n",
        "Profile image URL",
        { allowLocal: true },
      ),
    ).toBeNull();
    expect(
      galleryUrlsError(
        "/about/1.jpg\n/\\evil.com/x.jpg",
        "Profile image URL",
        { allowLocal: true },
      ),
    ).toBe("Profile image URL (line 2) must be a valid http(s) URL.");
    expect(
      galleryUrlsError("not-a-url", "Gallery image URL", { allowLocal: true }),
    ).toBe("Gallery image URL (line 1) must be a valid http(s) URL.");
  });
});
