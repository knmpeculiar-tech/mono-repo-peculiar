import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { buttonClassName } from "@/components/ui/Button";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="New product"
        backHref="/admin/products"
        backLabel="Products"
        actions={
          <button type="submit" form="product-form" className={buttonClassName()}>
            Create product
          </button>
        }
      />
      <ProductForm />
    </div>
  );
}
