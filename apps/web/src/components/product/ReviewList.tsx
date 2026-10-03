"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { resolveStorageUrl } from "@/lib/storage";
import type { Review } from "@/types/api";
import { ReviewStars } from "./ReviewStars";

const PAGE_SIZE = 5;

/** First letter(s) of the author's name, used as a fallback avatar. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Distribution bar for the rating summary. */
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm sm:gap-3">
      <span className="text-muted-foreground w-5 shrink-0 text-right text-xs sm:text-sm">
        {star}★
      </span>
      <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full sm:h-2.5">
        <div
          className="bg-brand h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums sm:text-sm">
        {count}
      </span>
    </div>
  );
}

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
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Distribution: count per star rating (5 → 1)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  function showMore() {
    setFocusIndex(visibleCount);
    setVisibleCount((count) => count + PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* ── Rating summary header ─────────────────────────── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-12">
        {/* Big average number */}
        <div className="flex flex-col items-center gap-1 sm:min-w-[140px]">
          <span
            className="text-foreground text-5xl font-semibold leading-none tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {avg.toFixed(1)}
          </span>
          <ReviewStars rating={avg} size={20} />
          <span className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        </div>
        {/* Distribution bars */}
        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
          {distribution.map(({ star, count }) => (
            <RatingBar key={star} star={star} count={count} total={reviews.length} />
          ))}
        </div>
      </div>

      {/* ── Review cards ──────────────────────────────────── */}
      <ul className="flex flex-col gap-4 sm:gap-5">
        {visible.map((review, index) => (
          <li
            key={review.id}
            ref={index === focusIndex ? firstNewRef : undefined}
            tabIndex={index === focusIndex ? -1 : undefined}
            className="bg-surface-muted/60 rounded-xl px-4 py-5 outline-none sm:rounded-2xl sm:px-6 sm:py-6"
          >
            {/* Header row: avatar + name + stars */}
            <div className="mb-2.5 flex items-center gap-3 sm:mb-3">
              <span
                aria-hidden="true"
                className="bg-brand-100 text-brand-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase sm:h-10 sm:w-10 sm:text-sm"
              >
                {initials(review.authorName)}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-foreground text-sm font-semibold sm:text-base">
                  {review.authorName}
                </span>
                <ReviewStars rating={review.rating} size={14} />
              </div>
            </div>

            {/* Title */}
            {review.title && (
              <h3 className="text-foreground mb-1 text-sm font-semibold leading-snug sm:text-base">
                {review.title}
              </h3>
            )}

            {/* Body */}
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              {review.body}
            </p>

            {/* Media */}
            {review.imagePaths.length > 0 || review.videoPaths.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                {review.imagePaths.map((path) => (
                  <div
                    key={path}
                    className="bg-surface-muted relative h-16 w-16 overflow-hidden rounded-lg sm:h-20 sm:w-20"
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
                    className="h-16 w-28 rounded-lg bg-black sm:h-20 sm:w-32"
                  />
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {/* Show more */}
      {remaining > 0 ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={showMore}>
            Show more reviews ({remaining} more)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
