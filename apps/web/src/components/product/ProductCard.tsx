import Image from "next/image";
import Link from "next/link";
import { PriceTag } from "@/components/product/PriceTag";
import { resolveStorageUrl } from "@/lib/storage";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  // The cheapest variant drives the "From" price, paired with its own MRP.
  const cheapest = product.variants.reduce<(typeof product.variants)[number] | null>(
    (best, variant) => (best === null || variant.priceInPaise < best.priceInPaise ? variant : best),
    null,
  );

  return (
    <Link
      href={`/products/${product.slug}`}
      className="border-border bg-surface group flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      <div className="bg-surface-muted relative flex aspect-square items-center justify-center">
        <Image
          // Falls back to a placeholder packaging photo until this product
          // has real photography uploaded — see docs/decisions.md.
          src={primaryImage ? resolveStorageUrl(primaryImage.storagePath) : "/package.png"}
          alt={primaryImage?.altText ?? product.name}
          fill
          sizes="(min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-body font-medium">{product.name}</h3>
        {cheapest ? (
          <PriceTag
            priceInPaise={cheapest.priceInPaise}
            mrpInPaise={cheapest.mrpInPaise}
            prefix="From"
            size="sm"
          />
        ) : null}
      </div>
    </Link>
  );
}
