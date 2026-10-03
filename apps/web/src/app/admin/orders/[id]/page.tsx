import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderCommunicationPanel } from "@/components/admin/OrderCommunicationPanel";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { OrderDetailCard } from "@/components/order/OrderDetailCard";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api/client";
import { getAdminOrder } from "@/lib/api/admin/orders";
import { formatIST } from "@/lib/date";
import { formatPaise } from "@/lib/money";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let order;
  try {
    order = await getAdminOrder(id, session?.access_token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  const address = order.shippingAddress;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <AdminPageHeader
        title={order.orderNumber}
        backHref="/admin/orders"
        backLabel="Orders"
        actions={
          <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        }
      />
      <div className="text-caption flex flex-col gap-0.5">
        <p>Placed {formatIST(order.createdAt)}</p>
        <p>Last updated {formatIST(order.updatedAt)}</p>
      </div>

      <OrderStatusControl order={order} />
      <OrderCommunicationPanel order={order} />

      <div className="border-border rounded-lg border p-5">
        <h2 className="text-heading-3 mb-4">Customer</h2>
        <p className="text-body">{order.customerName}</p>
        {order.customerEmail ? <p className="text-caption">{order.customerEmail}</p> : null}
        <p className="text-caption">{order.customerPhone}</p>
        <div className="text-caption mt-3">
          <p>{address.line1}</p>
          {address.line2 ? <p>{address.line2}</p> : null}
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.country}</p>
        </div>
      </div>

      <OrderDetailCard order={order} />

      {order.payments.length > 0 ? (
        <div className="border-border rounded-lg border p-5">
          <h2 className="text-heading-3 mb-4">Payments</h2>
          <ul className="flex flex-col gap-2">
            {order.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between text-sm">
                <span>
                  {payment.provider} &middot; {payment.status}
                </span>
                <span>{formatPaise(payment.amountInPaise)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
