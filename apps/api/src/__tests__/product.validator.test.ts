import { describe, expect, it } from "vitest";
import { setVariantsSchema } from "../validators/product.validator";

const SMALL = "11111111-1111-4111-8111-111111111111";
const LARGE = "22222222-2222-4222-8222-222222222222";
const REGULAR = "33333333-3333-4333-8333-333333333333";

const row = (overrides: Record<string, unknown> = {}) => ({
  sizeOptionId: SMALL,
  packOptionId: REGULAR,
  sku: "PAD-S-6",
  priceInPaise: 14900,
  mrpInPaise: 19900,
  ...overrides,
});

describe("setVariantsSchema", () => {
  it("accepts a valid grid, with stock optional", () => {
    const result = setVariantsSchema.safeParse({
      variants: [row(), row({ sizeOptionId: LARGE, sku: "PAD-L-6", stock: 10 })],
    });
    expect(result.success).toBe(true);
  });

  it("accepts MRP equal to price (no discount shown)", () => {
    expect(setVariantsSchema.safeParse({ variants: [row({ mrpInPaise: 14900 })] }).success).toBe(true);
  });

  it("rejects MRP below the selling price", () => {
    const result = setVariantsSchema.safeParse({ variants: [row({ mrpInPaise: 9900 })] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["variants", 0, "mrpInPaise"]);
  });

  it("rejects the same size and pack twice", () => {
    const result = setVariantsSchema.safeParse({ variants: [row(), row({ sku: "OTHER" })] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/Duplicate size and pack/);
  });

  it("rejects duplicate SKUs case-insensitively", () => {
    const result = setVariantsSchema.safeParse({
      variants: [row(), row({ sizeOptionId: LARGE, sku: "pad-s-6" })],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/Duplicate SKU/);
  });

  it("allows an empty grid (archives every variant)", () => {
    expect(setVariantsSchema.safeParse({ variants: [] }).success).toBe(true);
  });
});
