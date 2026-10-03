import type { CartItem } from "@/lib/cart/cartReducer";
import { formatPaise } from "@/lib/money";

export function OrderSummary({
  items,
  subtotalInPaise,
}: {
  items: CartItem[];
  subtotalInPaise: number;
}) {
  return (
    <div className="border-border bg-surface rounded-lg border p-5">
      <h2 className="text-heading-3 mb-4">Order summary</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.variantId} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{item.snapshot.productName}</p>
              <p className="text-caption">
                {item.snapshot.variantLabel} &times; {item.quantity}
              </p>
            </div>
            <p>{formatPaise(item.snapshot.priceInPaise * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
        <span className="font-medium">Subtotal</span>
        <span className="font-semibold">{formatPaise(subtotalInPaise)}</span>
      </div>
      <p className="text-caption mt-1">Free shipping for now.</p>
    </div>
  );
}
