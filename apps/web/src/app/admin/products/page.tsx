import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { listAdminProducts } from "@/lib/api/admin/products";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const products = await listAdminProducts(session?.access_token);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Products"
        actions={
          <>
            <Link href="/admin/products/options" className={buttonClassName({ variant: "secondary" })}>
              Sizes &amp; packs
            </Link>
            <Link href="/admin/products/new" className={buttonClassName()}>
              New product
            </Link>
          </>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product to start selling."
          action={
            <Link href="/admin/products/new" className={buttonClassName()}>
              New product
            </Link>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th>Variants</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {products.map((product) => (
              <Tr key={product.id}>
                <Td>{product.name}</Td>
                <Td className="text-muted-foreground">{product.slug}</Td>
                <Td>
                  <Badge variant={product.isActive ? "success" : "neutral"}>
                    {product.isActive ? "Active" : "Archived"}
                  </Badge>
                </Td>
                <Td>{product.variants.length}</Td>
                <Td>
                  <Link href={`/admin/products/${product.id}`} className="text-brand hover:underline">
                    Edit
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
