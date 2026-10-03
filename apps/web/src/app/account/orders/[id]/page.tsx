import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderDetailCard } from "@/components/order/OrderDetailCard";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api/client";
import { getMyOrder } from "@/lib/api/orders";
import { formatIST } from "@/lib/date";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountOrderPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/account/orders/${id}`);
  }

  let order;
  try {
    order = await getMyOrder(id, session.access_token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-heading-1">{order.orderNumber}</h1>
        <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>
      <div className="text-caption mb-6 flex flex-col gap-0.5">
        <p>Placed {formatIST(order.createdAt)}</p>
        <p>Last updated {formatIST(order.updatedAt)}</p>
      </div>
      <OrderDetailCard order={order} />
    </div>
  );
}
