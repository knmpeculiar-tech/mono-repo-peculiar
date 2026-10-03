import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { ImagesPanel } from "@/components/admin/ImagesPanel";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantsPanel } from "@/components/admin/VariantsPanel";
import { ApiError } from "@/lib/api/client";
import { listPackOptions, listSizeOptions } from "@/lib/api/admin/options";
import { getAdminProduct } from "@/lib/api/admin/products";
import { createClient } from "@/lib/supabase/server";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string, accessToken?: string | null) {
  try {
    return await getAdminProduct(id, accessToken);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export const metadata: Metadata = { title: "Edit product" };

export default async function AdminProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [product, sizes, packs] = await Promise.all([
    loadProduct(id, session?.access_token),
    listSizeOptions(session?.access_token),
    listPackOptions(session?.access_token),
  ]);
  if (!product) {
    notFound();
  }

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <AdminPageHeader
        title={product.name}
        backHref="/admin/products"
        backLabel="Products"
        actions={
          <SaveButton form="product-form" pendingLabel="Saving…">
            Save changes
          </SaveButton>
        }
      />
      <ProductForm product={product} />
      <VariantsPanel
        productId={product.id}
        productSlug={product.slug}
        variants={product.variants}
        sizes={sizes}
        packs={packs}
      />
      <ImagesPanel productId={product.id} images={product.images} />
    </div>
  );
}
