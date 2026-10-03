import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, hyphen-separated"),
  description: z.string().trim().min(1).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// The admin's full "what this product is sold as" grid, saved in one go:
// every combination listed here is live afterward; any existing variant not
// listed is archived (never deleted — past orders reference it).
const variantRowSchema = z
  .object({
    sizeOptionId: z.string().uuid(),
    packOptionId: z.string().uuid(),
    sku: z.string().trim().min(1).max(50),
    priceInPaise: z.number().int().positive(),
    mrpInPaise: z.number().int().positive(),
    // Omit to leave an existing variant's stock untouched — so saving a
    // price change can't overwrite stock that checkouts decremented since
    // the admin opened the page. New variants default to 0.
    stock: z.number().int().min(0).optional(),
  })
  .refine((row) => row.mrpInPaise >= row.priceInPaise, {
    message: "MRP can't be lower than the selling price",
    path: ["mrpInPaise"],
  });

export const setVariantsSchema = z
  .object({ variants: z.array(variantRowSchema).max(100) })
  .superRefine(({ variants }, ctx) => {
    const combos = new Set<string>();
    const skus = new Set<string>();
    variants.forEach((row, index) => {
      const combo = `${row.sizeOptionId}:${row.packOptionId}`;
      if (combos.has(combo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index],
          message: "Duplicate size and pack combination",
        });
      }
      combos.add(combo);
      const sku = row.sku.toLowerCase();
      if (skus.has(sku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "sku"],
          message: `Duplicate SKU ${row.sku}`,
        });
      }
      skus.add(sku);
    });
  });

// storagePath refers to a Supabase Storage object path, uploaded separately
// — this endpoint just records the reference, not the upload itself.
export const createImageSchema = z.object({
  storagePath: z.string().trim().min(1),
  altText: z.string().trim().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const updateImageSchema = createImageSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SetVariantsInput = z.infer<typeof setVariantsSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
