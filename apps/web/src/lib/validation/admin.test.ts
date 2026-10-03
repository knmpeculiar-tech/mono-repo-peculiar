import { describe, expect, it } from "vitest";
import { packOptionFormSchema, productFormSchema, variantRowFormSchema } from "./admin";

describe("productFormSchema", () => {
  const valid = { name: "Peculiar Pads", slug: "peculiar-pads", description: "", isActive: true };

  it("accepts a valid product", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = productFormSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with uppercase letters", () => {
    const result = productFormSchema.safeParse({ ...valid, slug: "Peculiar-Pads" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with spaces", () => {
    const result = productFormSchema.safeParse({ ...valid, slug: "peculiar pads" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with a leading hyphen", () => {
    const result = productFormSchema.safeParse({ ...valid, slug: "-peculiar-pads" });
    expect(result.success).toBe(false);
  });

  it("accepts a slug with numbers and hyphens", () => {
    const result = productFormSchema.safeParse({ ...valid, slug: "pads-2-pack" });
    expect(result.success).toBe(true);
  });
});

describe("variantRowFormSchema", () => {
  const valid = { sku: "SM-REG", priceInPaise: "149", mrpInPaise: "199.00", stock: "10" };

  it("accepts valid input and converts both prices to paise", () => {
    const result = variantRowFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceInPaise).toBe(14900);
      expect(result.data.mrpInPaise).toBe(19900);
      expect(result.data.stock).toBe(10);
    }
  });

  it("accepts MRP equal to the price", () => {
    expect(variantRowFormSchema.safeParse({ ...valid, mrpInPaise: "149" }).success).toBe(true);
  });

  it("rejects MRP below the price, flagged on the MRP field", () => {
    const result = variantRowFormSchema.safeParse({ ...valid, mrpInPaise: "99" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["mrpInPaise"]);
  });

  it("rejects a zero price", () => {
    expect(variantRowFormSchema.safeParse({ ...valid, priceInPaise: "0" }).success).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(variantRowFormSchema.safeParse({ ...valid, stock: "-1" }).success).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    expect(variantRowFormSchema.safeParse({ ...valid, priceInPaise: "free" }).success).toBe(false);
  });
});

describe("packOptionFormSchema", () => {
  it("accepts a pack with a pad count", () => {
    const result = packOptionFormSchema.safeParse({ name: "Jumbo Pack", padsPerPack: "12", sortOrder: "1" });
    expect(result.success && result.data.padsPerPack).toBe(12);
  });

  it("rejects a pack with zero pads", () => {
    const result = packOptionFormSchema.safeParse({ name: "Empty", padsPerPack: "0", sortOrder: "0" });
    expect(result.success).toBe(false);
  });
});
