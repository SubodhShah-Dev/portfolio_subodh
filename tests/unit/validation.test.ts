import { describe, expect, it } from "vitest";

import { emailError, optionalEmailError } from "../../src/utils/validation";

describe("emailError", () => {
  it("requires a value", () => {
    expect(emailError("Email", "")).toBe("Email is required.");
  });

  it("rejects malformed addresses", () => {
    expect(emailError("Email", "not-an-email")).toBe(
      "Email must be a valid email address.",
    );
  });

  it("accepts valid addresses", () => {
    expect(emailError("Email", "ada@example.com")).toBeNull();
  });
});

describe("optionalEmailError", () => {
  it("accepts blank values", () => {
    expect(optionalEmailError("Email", "")).toBeNull();
    expect(optionalEmailError("Email", "   ")).toBeNull();
  });

  it("rejects non-blank malformed addresses", () => {
    expect(optionalEmailError("Email", "not-an-email")).toBe(
      "Email must be a valid email address.",
    );
  });

  it("accepts valid addresses", () => {
    expect(optionalEmailError("Email", "ada@example.com")).toBeNull();
    expect(optionalEmailError("Email", "  ada@example.com  ")).toBeNull();
  });
});
