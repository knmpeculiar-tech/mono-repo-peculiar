import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { PriceTag } from "@/components/product/PriceTag";
import { resolveStorageUrl } from "@/lib/storage";
import type { Product } from "@/types/api";

export function FeaturedProduct({ product }: { product: Product }) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  // The cheapest variant drives the "From" price, paired with its own MRP.
  const cheapest = product.variants.reduce<(typeof product.variants)[number] | null>(
    (best, variant) => (best === null || variant.priceInPaise < best.priceInPaise ? variant : best),
    null,
  );
  const sizes = Array.from(new Set(product.variants.map((variant) => variant.size)));

  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className="bg-surface-muted relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl">
        <Image
          // aspect-square matches the actual product photos (1:1) — an
          // aspect-[4/5] container here previously forced a ~20% side crop
          // on every square image, cutting into the composition's edges.
          // Falls back to a placeholder packaging photo until this
          // product has real photography uploaded — see docs/decisions.md.
          src={primaryImage ? resolveStorageUrl(primaryImage.storagePath) : "/package.png"}
          alt={primaryImage?.altText ?? product.name}
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-4">
        <p className="eyebrow">Our product</p>
        <h3 className="text-heading-2">{product.name}</h3>
        {product.description ? (
          <p className="text-body text-muted-foreground">{product.description}</p>
        ) : null}
        {sizes.length > 0 ? <p className="text-caption">Available in {sizes.join(", ")}</p> : null}
        {cheapest ? (
          <PriceTag
            priceInPaise={cheapest.priceInPaise}
            mrpInPaise={cheapest.mrpInPaise}
            prefix="From"
            size="lg"
          />
        ) : null}
        <div>
          <Link href={`/products/${product.slug}`} className={buttonClassName({ size: "md" })}>
            Shop {product.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
