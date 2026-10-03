"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { resolveStorageUrl } from "@/lib/storage";
import type { Review } from "@/types/api";
import { ReviewStars } from "./ReviewStars";

const PAGE_SIZE = 5;

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // After "Show more", focus lands on the first newly revealed review, so
  // keyboard and screen-reader users continue reading instead of being left
  // on the button.
  const firstNewRef = useRef<HTMLLIElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusIndex !== null) firstNewRef.current?.focus();
  }, [focusIndex]);

  if (reviews.length === 0) {
    return <p className="text-caption">No reviews yet.</p>;
  }

  const visible = reviews.slice(0, visibleCount);
  const remaining = reviews.length - visible.length;

  function showMore() {
    setFocusIndex(visibleCount);
    setVisibleCount((count) => count + PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-6">
        {visible.map((review, index) => (
          <li
            key={review.id}
            ref={index === focusIndex ? firstNewRef : undefined}
            tabIndex={index === focusIndex ? -1 : undefined}
            className="border-border border-b pb-6 outline-none last:border-none"
          >
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
      {remaining > 0 ? (
        <div>
          <Button variant="secondary" onClick={showMore}>
            Show more reviews ({remaining} more)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
