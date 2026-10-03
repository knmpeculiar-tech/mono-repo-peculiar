"use client";

import { useState } from "react";
import { PriceTag } from "@/components/product/PriceTag";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartProvider";
import type { ProductVariant } from "@/types/api";

interface VariantSelectorProps {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variants: ProductVariant[];
}

function uniqueInOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

function pillClassName(isSelected: boolean) {
  return isSelected
    ? "bg-brand text-brand-foreground border-brand rounded-full border px-4 py-2 text-sm"
    : "border-border hover:border-brand rounded-full border px-4 py-2 text-sm";
}

export function VariantSelector({
  productSlug,
  productName,
  imageUrl,
  variants,
}: VariantSelectorProps) {
  const { add } = useCart();
  const sizes = uniqueInOrder(variants.map((v) => v.size));
  const containerTypes = uniqueInOrder(variants.map((v) => v.containerType));
  const padsByContainerType = new Map(variants.map((v) => [v.containerType, v.padsPerPack]));

  // Seed from an actual variant, not independently-first values from each
  // axis — those two combined might not correspond to a real variant.
  const [selectedSize, setSelectedSize] = useState<string | null>(variants[0]?.size ?? null);
  const [selectedContainerType, setSelectedContainerType] = useState<string | null>(
    variants[0]?.containerType ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const resolvedVariant =
    variants.find((v) => v.size === selectedSize && v.containerType === selectedContainerType) ??
    null;
  const maxQuantity = Math.min(50, resolvedVariant?.stock ?? 50);

  // Every pill's value exists in at least one variant by construction (sizes/
  // containerTypes are derived from `variants`), so nothing is ever hidden.
  // Rather than disabling a pill when it doesn't pair with the CURRENTLY
  // selected other axis — which can deadlock on a sparse grid (e.g. only
  // Medium+Regular and Large+Jumbo exist: both "Large" and "Jumbo" would be
  // simultaneously disabled from the initial state, trapping the user) —
  // selecting a pill snaps the other axis to the first variant that actually
  // pairs with it, so a valid combination is always reachable in one click.
  function handleSelectSize(size: string) {
    setSelectedSize(size);
    const stillValid = variants.some(
      (v) => v.size === size && v.containerType === selectedContainerType,
    );
    if (!stillValid) {
      const fallback = variants.find((v) => v.size === size);
      if (fallback) setSelectedContainerType(fallback.containerType);
    }
  }

  function handleSelectContainerType(containerType: string) {
    setSelectedContainerType(containerType);
    const stillValid = variants.some(
      (v) => v.containerType === containerType && v.size === selectedSize,
    );
    if (!stillValid) {
      const fallback = variants.find((v) => v.containerType === containerType);
      if (fallback) setSelectedSize(fallback.size);
    }
  }

  function handleAddToCart() {
    if (!resolvedVariant || resolvedVariant.stock <= 0) return;
    add(resolvedVariant.id, quantity, {
      productSlug,
      productName,
      variantLabel: resolvedVariant.name,
      priceInPaise: resolvedVariant.priceInPaise,
      imageUrl,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  if (variants.length === 0) {
    return <p className="text-caption">Currently unavailable.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-caption mb-2">Size</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSelectSize(size)}
              aria-pressed={size === selectedSize}
              className={pillClassName(size === selectedSize)}
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-caption mb-2">Pack</legend>
        <div className="flex flex-wrap gap-2">
          {containerTypes.map((containerType) => (
            <button
              key={containerType}
              type="button"
              onClick={() => handleSelectContainerType(containerType)}
              aria-pressed={containerType === selectedContainerType}
              className={pillClassName(containerType === selectedContainerType)}
            >
              {containerType}
              <span className="opacity-75"> · {padsByContainerType.get(containerType)} pads</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between" aria-live="polite">
        <div>
          {resolvedVariant ? (
            <>
              <PriceTag
                priceInPaise={resolvedVariant.priceInPaise}
                mrpInPaise={resolvedVariant.mrpInPaise}
                size="lg"
              />
              <p className="text-caption">
                {resolvedVariant.stock <= 0
                  ? "Out of stock"
                  : resolvedVariant.stock <= 5
                    ? `Only ${resolvedVariant.stock} left`
                    : "In stock"}
              </p>
            </>
          ) : (
            <p className="text-caption">This combination isn&apos;t available.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="border-border hover:bg-surface-muted h-9 w-9 rounded border"
          >
            &minus;
          </button>
          <span className="w-6 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            aria-label="Increase quantity"
            className="border-border hover:bg-surface-muted h-9 w-9 rounded border"
          >
            +
          </button>
        </div>
      </div>

      <Button onClick={handleAddToCart} disabled={!resolvedVariant || resolvedVariant.stock <= 0}>
        {justAdded ? "Added ✓" : "Add to cart"}
      </Button>
    </div>
  );
}
