"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, useToast } from "@/components/admin/feedback/AdminFeedback";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { CommunicationField } from "@/lib/api/admin/orders";
import { updateOrderCommunication } from "@/lib/api/admin/orders";
import { formatIST } from "@/lib/date";
import type { Order } from "@/types/api";

const ROWS: { field: CommunicationField; label: string }[] = [
  { field: "confirmation", label: "Order confirmation" },
  { field: "dispatch", label: "Dispatch" },
  { field: "delivery", label: "Delivery" },
];

export function OrderCommunicationPanel({ order }: { order: Order }) {
  const router = useRouter();
  const [pendingField, setPendingField] = useState<CommunicationField | null>(null);
  const toast = useToast();

  const sentAtByField: Record<CommunicationField, string | null> = {
    confirmation: order.confirmationMsgSentAt,
    dispatch: order.dispatchMsgSentAt,
    delivery: order.deliveryMsgSentAt,
  };

  async function handleToggle(field: CommunicationField, sent: boolean) {
    setPendingField(field);
    try {
      await updateOrderCommunication(order.id, field, sent);
      const label = ROWS.find((row) => row.field === field)?.label ?? "Message";
      toast.success(sent ? `${label} message marked as sent` : `${label} message marked as not sent`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update this."));
    } finally {
      setPendingField(null);
    }
  }

  return (
    <div className="border-border rounded-lg border p-5">
      <h2 className="text-heading-3 mb-1">WhatsApp updates</h2>
      <p className="text-caption mb-4">
        Track which messages you&apos;ve sent the customer — independent of order status.
      </p>
      <div className="flex flex-col gap-3">
        {ROWS.map(({ field, label }) => {
          const sentAt = sentAtByField[field];
          const isPending = pendingField === field;
          return (
            <div key={field} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-body font-medium">{label}</p>
                <p className="text-caption">{sentAt ? `Sent ${formatIST(sentAt)}` : "Not sent yet"}</p>
              </div>
              <Button
                size="sm"
                variant={sentAt ? "ghost" : "secondary"}
                onClick={() => handleToggle(field, !sentAt)}
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : sentAt ? (
                  "Undo"
                ) : (
                  "Mark sent"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
