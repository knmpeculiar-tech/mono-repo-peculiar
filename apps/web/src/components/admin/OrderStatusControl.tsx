"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { updateOrderStatus } from "@/lib/api/admin/orders";
import { ORDER_STATUS_LABEL, getAllowedNextStatuses } from "@/lib/orderStatus";
import type { AdminSettableOrderStatus } from "@/lib/orderStatus";
import type { Order } from "@/types/api";

export function OrderStatusControl({ order }: { order: Order }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<AdminSettableOrderStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextStatuses = getAllowedNextStatuses(order.status);

  async function handleTransition(status: AdminSettableOrderStatus) {
    setIsSubmitting(status);
    setErrorMessage(null);
    try {
      await updateOrderStatus(order.id, status);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't update the order.");
    } finally {
      setIsSubmitting(null);
    }
  }

  if (nextStatuses.length === 0) {
    return <p className="text-caption">This order is in a final state — no further status changes.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === "cancelled" ? "secondary" : "primary"}
            onClick={() => handleTransition(status)}
            disabled={isSubmitting !== null}
          >
            {isSubmitting === status ? "Updating…" : `Mark as ${ORDER_STATUS_LABEL[status]}`}
          </Button>
        ))}
      </div>
      {errorMessage ? <p className="text-danger text-caption">{errorMessage}</p> : null}
    </div>
  );
}
