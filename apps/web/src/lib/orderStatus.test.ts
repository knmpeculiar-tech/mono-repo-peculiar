import { describe, expect, it } from "vitest";
import { getAllowedNextStatuses } from "./orderStatus";

describe("getAllowedNextStatuses", () => {
  it("allows only cancelling a pending order", () => {
    expect(getAllowedNextStatuses("pending")).toEqual(["cancelled"]);
  });

  it("allows processing or cancelling a confirmed order", () => {
    expect(getAllowedNextStatuses("confirmed")).toEqual(["processing", "cancelled"]);
  });

  it("allows only shipping a processing order", () => {
    expect(getAllowedNextStatuses("processing")).toEqual(["shipped"]);
  });

  it("allows only delivering a shipped order", () => {
    expect(getAllowedNextStatuses("shipped")).toEqual(["delivered"]);
  });

  it("offers no transitions from a delivered order", () => {
    expect(getAllowedNextStatuses("delivered")).toEqual([]);
  });

  it("offers no transitions from a cancelled order", () => {
    expect(getAllowedNextStatuses("cancelled")).toEqual([]);
  });
});
