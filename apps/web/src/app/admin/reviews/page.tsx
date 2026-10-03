import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAdminProducts } from "@/lib/api/admin/products";
import { listAdminReviews } from "@/lib/api/admin/reviews";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  const [reviews, products] = await Promise.all([
    listAdminReviews(accessToken),
    listAdminProducts(accessToken),
  ]);
  const productNameById = Object.fromEntries(products.map((product) => [product.id, product.name]));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Reviews"
        actions={
          <Link href="/admin/reviews/new" className={buttonClassName()}>
            New review
          </Link>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews are admin-authored — there's no customer submission flow. Write the first one."
          action={
            <Link href="/admin/reviews/new" className={buttonClassName()}>
              New review
            </Link>
          }
        />
      ) : (
        <ReviewsTable reviews={reviews} productNameById={productNameById} />
      )}
    </div>
  );
}
