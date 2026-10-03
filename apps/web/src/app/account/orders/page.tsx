import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { listMyOrders } from "@/lib/api/orders";
import { formatIST } from "@/lib/date";
import { formatPaise } from "@/lib/money";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Belt-and-suspenders with proxy.ts, which already redirects unauthenticated
  // requests to /account/**.
  if (!session) {
    redirect("/login?next=/account/orders");
  }

  const orders = await listMyOrders(session.access_token);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-heading-1 mb-8">Your orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you place an order, it'll show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="border-border bg-surface hover:bg-surface-muted flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-caption">{formatIST(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                  <span className="font-medium">{formatPaise(order.totalInPaise)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
