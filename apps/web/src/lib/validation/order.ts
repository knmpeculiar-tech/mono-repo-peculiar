import { z } from "zod";

// Mirrors apps/api/src/validators/order.validator.ts's createOrderSchema — kept
// in sync by hand. Client-side validation is for fast user feedback only; the
// API re-validates and is the actual authority.

export const shippingAddressSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1).default("IN"),
});

export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(200),
  customerEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  customerPhone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  shippingAddress: shippingAddressSchema,
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
