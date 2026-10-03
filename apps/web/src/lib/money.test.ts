import { describe, expect, it } from "vitest";
import { formatPaise, parseRupeesToPaise } from "./money";

describe("formatPaise", () => {
  it("formats whole rupee amounts", () => {
    expect(formatPaise(10000)).toBe("₹100");
  });

  it("rounds to the nearest rupee (no paise shown)", () => {
    expect(formatPaise(10050)).toBe("₹101");
  });

  it("formats zero", () => {
    expect(formatPaise(0)).toBe("₹0");
  });

  it("formats large amounts with Indian digit grouping", () => {
    expect(formatPaise(150000000)).toBe("₹15,00,000");
  });
});

describe("parseRupeesToPaise", () => {
  it("parses a whole rupee amount", () => {
    expect(parseRupeesToPaise("250")).toBe(25000);
  });

  it("parses a decimal rupee amount", () => {
    expect(parseRupeesToPaise("250.50")).toBe(25050);
  });

  it("round-trips with formatPaise for a clean amount", () => {
    const paise = parseRupeesToPaise("99.99");
    expect(paise).toBe(9999);
    expect(formatPaise(paise)).toBe("₹100");
  });

  it("rejects a negative amount", () => {
    expect(() => parseRupeesToPaise("-5")).toThrow();
  });

  it("rejects non-numeric input", () => {
    expect(() => parseRupeesToPaise("abc")).toThrow();
  });

  it("rejects more than two decimal places", () => {
    expect(() => parseRupeesToPaise("10.005")).toThrow();
  });

  it("trims surrounding whitespace", () => {
    expect(parseRupeesToPaise("  50  ")).toBe(5000);
  });
});
