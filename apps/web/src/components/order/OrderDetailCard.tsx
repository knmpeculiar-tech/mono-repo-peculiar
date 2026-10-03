import { formatPaise } from "@/lib/money";
import type { Order } from "@/types/api";

export function OrderDetailCard({ order }: { order: Order }) {
  return (
    <div className="border-border rounded-lg border p-5">
      <h2 className="text-heading-3 mb-4">Order details</h2>
      <ul className="flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-caption">
                {item.variantName} &times; {item.quantity}
              </p>
            </div>
            <p>{formatPaise(item.totalPriceInPaise)}</p>
          </li>
        ))}
      </ul>
      <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
        <span className="font-medium">Total</span>
        <span className="font-semibold">{formatPaise(order.totalInPaise)}</span>
      </div>
    </div>
  );
}
