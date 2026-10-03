"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveStorageUrl } from "@/lib/storage";
import type { ProductImage } from "@/types/api";

const AUTOSCROLL_INTERVAL_MS = 4500;

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];
  const count = sorted.length;

  // Auto-advance through multiple photos — restarts on every change
  // (including a manual thumbnail click below, which also calls
  // setActiveIndex) so a click doesn't get immediately overridden a moment
  // later. Skipped entirely for a single image and for reduced-motion users.
  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOSCROLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, activeIndex]);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface-muted relative aspect-square overflow-hidden rounded-lg">
        <Image
          // object-contain, never cover: admin-uploaded product photos come in
          // any shape (the client's are 3:2), and cropping cuts off packaging
          // text. The square frame keeps the layout steady; spare space shows
          // the muted background.
          // Falls back to a placeholder packaging photo until this product
          // has real photography uploaded — see docs/decisions.md.
          src={active ? resolveStorageUrl(active.storagePath) : "/package.png"}
          alt={active?.altText ?? productName}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
          priority
        />
      </div>
      {sorted.length > 1 ? (
        <div className="flex gap-2">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`bg-surface-muted relative h-16 w-16 overflow-hidden rounded-md border ${
                index === activeIndex ? "border-brand" : "border-border"
              }`}
            >
              <Image
                src={resolveStorageUrl(image.storagePath)}
                alt=""
                fill
                sizes="64px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
