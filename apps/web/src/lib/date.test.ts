import { describe, expect, it } from "vitest";
import { formatIST } from "./date";

describe("formatIST", () => {
  it("converts a UTC instant to IST (UTC+5:30)", () => {
    expect(formatIST("2026-03-05T10:00:00.000Z")).toBe("05 Mar 2026, 03:30 pm IST");
  });

  it("rolls over to the next day when the +5:30 offset crosses midnight", () => {
    expect(formatIST("2026-03-05T20:00:00.000Z")).toBe("06 Mar 2026, 01:30 am IST");
  });
});
