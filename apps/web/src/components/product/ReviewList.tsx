import Image from "next/image";
import { resolveStorageUrl } from "@/lib/storage";
import type { Review } from "@/types/api";
import { ReviewStars } from "./ReviewStars";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-caption">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {reviews.map((review) => (
        <li key={review.id} className="border-border border-b pb-6 last:border-none">
          <div className="mb-1 flex items-center gap-2">
            <ReviewStars rating={review.rating} />
            <span className="text-body font-medium">{review.title}</span>
          </div>
          <p className="text-body text-muted-foreground mb-1">{review.body}</p>
          <p className="text-caption mb-3">{review.authorName}</p>
          {review.imagePaths.length > 0 || review.videoPaths.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {review.imagePaths.map((path) => (
                <div
                  key={path}
                  className="bg-surface-muted relative h-20 w-20 overflow-hidden rounded-md"
                >
                  <Image
                    src={resolveStorageUrl(path)}
                    alt={`Photo from ${review.authorName}'s review`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
              {review.videoPaths.map((path) => (
                <video
                  key={path}
                  src={resolveStorageUrl(path)}
                  controls
                  className="h-20 w-32 rounded-md bg-black"
                />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
