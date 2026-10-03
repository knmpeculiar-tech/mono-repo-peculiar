import { z } from "zod";

const orderItemSchema = z.object({
  variantId: z.string().uuid("variantId must be a valid id"),
  quantity: z.number().int().positive().max(50),
});

const shippingAddressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1).default("IN"),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "at least one item is required"),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().min(6).max(20),
  shippingAddress: shippingAddressSchema,
});

// 'confirmed' isn't here deliberately — that transition happens only via
// payment capture (see services/order.service.ts markOrderPaid), never a
// direct admin action.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
});

export const orderStatusFilterSchema = z
  .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
  .optional();

// Independent of status — see services/order.service.ts and docs/decisions.md.
export const updateOrderCommunicationSchema = z.object({
  field: z.enum(["confirmation", "dispatch", "delivery"]),
  sent: z.boolean(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderCommunicationInput = z.infer<typeof updateOrderCommunicationSchema>;
