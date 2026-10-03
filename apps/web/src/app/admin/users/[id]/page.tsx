import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserDeleteButton } from "@/components/admin/UserDeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { ApiError } from "@/lib/api/client";
import { getAdminUser } from "@/lib/api/admin/users";
import { formatIST } from "@/lib/date";
import { formatPaise } from "@/lib/money";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "User details" };

export default async function AdminUserPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let user;
  try {
    user = await getAdminUser(id, session?.access_token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title={user.email}
        backHref="/admin/users"
        backLabel="Users"
        actions={<UserDeleteButton user={user} />}
      />

      <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <p className="text-caption">Role</p>
          <Badge variant={user.role === "ADMIN" ? "brand" : "neutral"}>{user.role}</Badge>
        </div>
        <div>
          <p className="text-caption">Joined</p>
          <p className="text-body">{formatIST(user.createdAt)}</p>
        </div>
        {user.fullName ? (
          <div>
            <p className="text-caption">Full name</p>
            <p className="text-body">{user.fullName}</p>
          </div>
        ) : null}
        {user.phone ? (
          <div>
            <p className="text-caption">Phone</p>
            <p className="text-body">{user.phone}</p>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="text-heading-3 mb-3">Orders</h2>
        {user.orders.length === 0 ? (
          <p className="text-caption">No orders yet.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {user.orders.map((order) => (
                <Tr key={order.id}>
                  <Td>{order.orderNumber}</Td>
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
    </div>
  );
}
