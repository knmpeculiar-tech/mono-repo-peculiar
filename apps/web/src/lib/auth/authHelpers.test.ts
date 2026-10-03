import { describe, expect, it } from "vitest";
import { authErrorMessage, safeNextPath } from "./authHelpers";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/checkout")).toBe("/checkout");
    expect(safeNextPath("/account/orders?page=2")).toBe("/account/orders?page=2");
  });

  it("rejects anything that could leave the site", () => {
    for (const next of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "evil.com",
      "javascript:alert(1)",
    ]) {
      expect(safeNextPath(next)).toBe("/");
    }
  });

  it("falls back when missing", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/account")).toBe("/account");
  });
});

describe("authErrorMessage", () => {
  it("maps known Supabase codes to customer-facing copy", () => {
    expect(
      authErrorMessage({
        code: "invalid_credentials",
        message: "Invalid login credentials",
        status: 400,
      }),
    ).toMatch(/don't match/);
  });

  it("treats any 429 as rate limiting", () => {
    expect(authErrorMessage({ code: undefined, message: "x", status: 429 })).toMatch(/Too many/);
  });

  it("never echoes unknown raw messages", () => {
    expect(
      authErrorMessage({ code: "unexpected_failure", message: "db: relation x", status: 500 }),
    ).toBe("Something went wrong. Please try again.");
  });
});
