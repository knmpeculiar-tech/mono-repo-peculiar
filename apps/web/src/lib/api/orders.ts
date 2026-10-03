import type { Order } from "@/types/api";
import type { CheckoutFormInput } from "@/lib/validation/order";
import { apiFetch } from "./client";

export interface CreateOrderInput extends CheckoutFormInput {
  items: { variantId: string; quantity: number }[];
}

// Not accessToken: null — sign-in is required to check out (see
// docs/decisions.md), so this auto-detects the current browser session like
// any other Client Component call; the API rejects a missing/invalid one.
export function createOrder(input: CreateOrderInput, idempotencyKey: string) {
  return apiFetch<Order>("/orders", { method: "POST", body: input, idempotencyKey });
}

export function listMyOrders(accessToken?: string | null) {
  return apiFetch<Order[]>("/orders", { accessToken });
}

export function getMyOrder(id: string, accessToken?: string | null) {
  return apiFetch<Order>(`/orders/${id}`, { accessToken });
}
