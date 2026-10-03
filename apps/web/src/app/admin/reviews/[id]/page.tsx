import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { buttonClassName } from "@/components/ui/Button";
import { listAdminProducts } from "@/lib/api/admin/products";
import { listAdminReviews } from "@/lib/api/admin/reviews";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit review" };

// There's no GET /admin/reviews/:id endpoint (only list + create/update/delete
// by id) — fine at this scale since the list itself has no pagination either,
// so finding the one to edit client-side costs nothing extra.
export default async function EditReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const [reviews, products] = await Promise.all([
    listAdminReviews(accessToken),
    listAdminProducts(accessToken),
  ]);
  const review = reviews.find((candidate) => candidate.id === id);
  if (!review) {
    notFound();
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <AdminPageHeader
        title="Edit review"
        backHref="/admin/reviews"
        backLabel="Reviews"
        actions={
          <button type="submit" form="review-form" className={buttonClassName()}>
            Save changes
          </button>
        }
      />
      <ReviewForm products={products} review={review} />
    </div>
  );
}
