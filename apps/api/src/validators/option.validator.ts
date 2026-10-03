import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(50);
const sortOrderSchema = z.number().int().min(0).max(1000);

export const createSizeOptionSchema = z.object({
  name: nameSchema,
  sortOrder: sortOrderSchema.optional(),
});
export const updateSizeOptionSchema = createSizeOptionSchema.partial();

export const createPackOptionSchema = z.object({
  name: nameSchema,
  padsPerPack: z.number().int().positive().max(1000),
  sortOrder: sortOrderSchema.optional(),
});
export const updatePackOptionSchema = createPackOptionSchema.partial();

export type CreateSizeOptionInput = z.infer<typeof createSizeOptionSchema>;
export type UpdateSizeOptionInput = z.infer<typeof updateSizeOptionSchema>;
export type CreatePackOptionInput = z.infer<typeof createPackOptionSchema>;
export type UpdatePackOptionInput = z.infer<typeof updatePackOptionSchema>;
