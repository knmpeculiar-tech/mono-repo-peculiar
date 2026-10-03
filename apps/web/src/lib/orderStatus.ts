import type { OrderStatus } from "@/types/api";
import type { BadgeVariant } from "@/components/ui/Badge";

// Mirrors apps/api/src/services/order.service.ts's ALLOWED_TRANSITIONS exactly —
// kept in sync by hand. This is pure UX (only offer valid next statuses in the
// admin status control); the backend remains the actual authority and still
// returns 409 if it ever disagrees.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// "pending" and "confirmed" never appear as a transition target above
// (pending->confirmed happens automatically on payment capture, never via the
// admin status-update endpoint) — this type documents that guarantee.
export type AdminSettableOrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export function getAllowedNextStatuses(current: OrderStatus): AdminSettableOrderStatus[] {
  return ALLOWED_TRANSITIONS[current] as AdminSettableOrderStatus[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: "neutral",
  confirmed: "brand",
  processing: "brand",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
};
