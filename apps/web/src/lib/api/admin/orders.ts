import type { Order, OrderStatus } from "@/types/api";
import type { AdminSettableOrderStatus } from "@/lib/orderStatus";
import { apiFetch } from "@/lib/api/client";

export type CommunicationField = "confirmation" | "dispatch" | "delivery";

export function listAdminOrders(status?: OrderStatus, accessToken?: string | null) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<Order[]>(`/admin/orders${query}`, { accessToken });
}

export function getAdminOrder(id: string, accessToken?: string | null) {
  return apiFetch<Order>(`/admin/orders/${id}`, { accessToken });
}

export function updateOrderStatus(
  id: string,
  status: AdminSettableOrderStatus,
  accessToken?: string | null,
) {
  return apiFetch<Order>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    accessToken,
  });
}

export function updateOrderCommunication(
  id: string,
  field: CommunicationField,
  sent: boolean,
  accessToken?: string | null,
) {
  return apiFetch<Order>(`/admin/orders/${id}/communication`, {
    method: "PATCH",
    body: { field, sent },
    accessToken,
  });
}
