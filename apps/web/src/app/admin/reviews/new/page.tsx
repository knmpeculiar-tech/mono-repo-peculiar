import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SaveButton } from "@/components/admin/feedback/SaveButton";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { listAdminProducts } from "@/lib/api/admin/products";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New review" };

export default async function NewReviewPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const products = await listAdminProducts(session?.access_token);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="New review"
        backHref="/admin/reviews"
        backLabel="Reviews"
        actions={
          <SaveButton form="review-form" pendingLabel="Creating…">
            Create review
          </SaveButton>
        }
      />
      <ReviewForm products={products} />
    </div>
  );
}
