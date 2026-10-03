import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="New product"
        backHref="/admin/products"
        backLabel="Products"
        actions={
          <SaveButton form="product-form" pendingLabel="Creating…">
            Create product
          </SaveButton>
        }
      />
      <ProductForm />
    </div>
  );
}
