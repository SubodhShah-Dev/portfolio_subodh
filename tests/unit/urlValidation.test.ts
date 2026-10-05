import { describe, expect, it } from "vitest";

import { isValidHttpUrl, urlError } from "../../src/utils/urlValidation";

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
