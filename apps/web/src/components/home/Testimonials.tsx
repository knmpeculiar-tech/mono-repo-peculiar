import { ReviewStars } from "@/components/product/ReviewStars";
import type { Review } from "@/types/api";

// Renders nothing when there are no reviews yet — same reasoning as
// BlogTeaser: an empty testimonials section is worse than no section.
export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="bg-surface-muted border-border border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="eyebrow mb-3">Reviews</p>
          <h2 className="text-heading-2">What people are saying.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <figure key={review.id} className="bg-surface flex flex-col gap-3 rounded-2xl p-6">
              <ReviewStars rating={review.rating} />
              <blockquote className="text-body text-sm">&ldquo;{review.body}&rdquo;</blockquote>
              <figcaption className="text-caption font-medium">{review.authorName}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
