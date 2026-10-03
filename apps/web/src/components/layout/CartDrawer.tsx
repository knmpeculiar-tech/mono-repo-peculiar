"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPaise } from "@/lib/money";

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { items, isHydrated, updateQuantity, remove, subtotalInPaise } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function goTo(path: string) {
    onClose();
    router.push(path);
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="bg-surface absolute top-0 right-0 flex h-full w-full max-w-md flex-col shadow-xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-heading-3">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="hover:bg-surface-muted rounded-md p-1"
          >
            &#10005;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!isHydrated ? null : items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Browse the catalog to find something you'll love."
              action={<Button onClick={() => goTo("/")}>Continue shopping</Button>}
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="bg-surface-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                    {item.snapshot.imageUrl ? (
                      <Image
                        src={item.snapshot.imageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-body font-medium">{item.snapshot.productName}</p>
                    <p className="text-caption">{item.snapshot.variantLabel}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="border-border hover:bg-surface-muted h-7 w-7 rounded border"
                        >
                          &minus;
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="border-border hover:bg-surface-muted h-7 w-7 rounded border"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPaise(item.snapshot.priceInPaise * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.variantId)}
                    aria-label={`Remove ${item.snapshot.productName} from cart`}
                    className="text-caption hover:text-danger self-start"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHydrated && items.length > 0 ? (
          <div className="border-border border-t px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-body font-medium">Subtotal</span>
              <span className="text-body font-semibold">{formatPaise(subtotalInPaise)}</span>
            </div>
            <Button className="w-full" onClick={() => goTo("/checkout")}>
              Checkout
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
