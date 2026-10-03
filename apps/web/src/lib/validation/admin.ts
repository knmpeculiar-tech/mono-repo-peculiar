import { z } from "zod";
import { parseRupeesToPaise } from "@/lib/money";

// Mirrors apps/api/src/validators/{product,review,blog}.validator.ts — kept in
// sync by hand. Client-side validation is for fast user feedback only; the API
// re-validates and is the actual authority.

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");

const rupeesSchema = z
  .string()
  .trim()
  .min(1, "Price is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 250 or 250.00")
  .transform((value) => parseRupeesToPaise(value))
  .refine((paise) => paise > 0, "Price must be greater than zero");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean(),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

// One row of the admin's size x pack grid. Prices are typed in rupees.
export const variantRowFormSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU is required").max(50),
    priceInPaise: rupeesSchema,
    mrpInPaise: rupeesSchema,
    stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  })
  .refine((row) => row.mrpInPaise >= row.priceInPaise, {
    message: "MRP can't be lower than the price",
    path: ["mrpInPaise"],
  });
export type VariantRowFormInput = z.infer<typeof variantRowFormSchema>;

const optionNameSchema = z.string().trim().min(1, "Name is required").max(50);
const sortOrderSchema = z.coerce
  .number()
  .int("Order must be a whole number")
  .min(0, "Order can't be negative");

export const sizeOptionFormSchema = z.object({
  name: optionNameSchema,
  sortOrder: sortOrderSchema,
});

export const packOptionFormSchema = z.object({
  name: optionNameSchema,
  padsPerPack: z.coerce
    .number()
    .int("Pads must be a whole number")
    .min(1, "A pack needs at least 1 pad"),
  sortOrder: sortOrderSchema,
});

export const imageFormSchema = z.object({
  altText: z.string().trim().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0),
  isPrimary: z.boolean(),
});
export type ImageFormInput = z.infer<typeof imageFormSchema>;

export const reviewFormSchema = z.object({
  productId: z.string().trim().min(1, "Select a product"),
  authorName: z.string().trim().min(1, "Author name is required").max(120),
  rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Review text is required").max(5000),
  isPublished: z.boolean(),
});
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export const blogFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required"),
  coverImageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  metaTitle: z.string().trim().max(200).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(300).optional().or(z.literal("")),
  isPublished: z.boolean(),
});
export type BlogFormInput = z.infer<typeof blogFormSchema>;
