"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, useToast } from "@/components/admin/feedback/AdminFeedback";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { updateOrderStatus } from "@/lib/api/admin/orders";
import { ORDER_STATUS_LABEL, getAllowedNextStatuses } from "@/lib/orderStatus";
import type { AdminSettableOrderStatus } from "@/lib/orderStatus";
import type { Order } from "@/types/api";

export function OrderStatusControl({ order }: { order: Order }) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState<AdminSettableOrderStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const nextStatuses = getAllowedNextStatuses(order.status);

  async function handleTransition(status: AdminSettableOrderStatus) {
    setIsSubmitting(status);
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order ${order.orderNumber} marked as ${ORDER_STATUS_LABEL[status].toLowerCase()}`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the order."));
    } finally {
      setIsSubmitting(null);
    }
  }

  // Cancelling is terminal and restocks the items, so it's confirmed first;
  // ConfirmDialog shows the outcome (its own progress, error, and toast).
  async function handleCancel() {
    await updateOrderStatus(order.id, "cancelled");
    router.refresh();
  }

  if (nextStatuses.length === 0) {
    return <p className="text-caption">This order is in a final state — no further status changes.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={status === "cancelled" ? "secondary" : "primary"}
          onClick={() => (status === "cancelled" ? setConfirmCancel(true) : handleTransition(status))}
          disabled={isSubmitting !== null}
          aria-busy={isSubmitting === status}
        >
          {isSubmitting === status ? (
            <>
              <Spinner />
              Updating…
            </>
          ) : (
            `Mark as ${ORDER_STATUS_LABEL[status]}`
          )}
        </Button>
      ))}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={`Cancel order ${order.orderNumber}?`}
        confirmLabel="Cancel order"
        pendingLabel="Cancelling…"
        successMessage={`Order ${order.orderNumber} cancelled`}
        onConfirm={handleCancel}
      >
        This can&apos;t be undone. The items go back into stock. If the customer already paid,
        refund them from the Razorpay dashboard — cancelling here doesn&apos;t refund.
      </ConfirmDialog>
    </div>
  );
}
