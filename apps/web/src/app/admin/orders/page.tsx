import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { listAdminOrders } from "@/lib/api/admin/orders";
import { formatIST } from "@/lib/date";
import { formatPaise } from "@/lib/money";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/api";

export const metadata: Metadata = { title: "Orders" };

const STATUS_TABS: { label: string; value?: OrderStatus }[] = [
  { label: "All" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

interface OrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status: rawStatus } = await searchParams;
  const status = STATUS_TABS.find((tab) => tab.value === rawStatus)?.value;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const orders = await listAdminOrders(status, session?.access_token);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Orders" />

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders"}
              className={`rounded-full px-3 py-1 text-sm ${
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders"
          description="Orders will show up here once customers start checking out."
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {orders.map((order) => (
              <Tr key={order.id}>
                <Td>{order.orderNumber}</Td>
                <Td>{order.customerName}</Td>
                <Td>{formatPaise(order.totalInPaise)}</Td>
                <Td>
                  <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">{formatIST(order.createdAt)}</Td>
                <Td>
                  <Link href={`/admin/orders/${order.id}`} className="text-brand hover:underline">
                    View
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
