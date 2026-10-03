// Display-only snapshot of the variant at the moment it was added — never
// trusted for price/stock at checkout, which always re-verifies against
// live data (see app/checkout/page.tsx's reconciliation step).
export interface CartItemSnapshot {
  productSlug: string;
  productName: string;
  variantLabel: string;
  priceInPaise: number;
  imageUrl: string | null;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  snapshot: CartItemSnapshot;
}

export type CartAction =
  | { type: "add"; variantId: string; quantity: number; snapshot: CartItemSnapshot }
  // "Buy now": the line ends up at exactly `quantity`, not existing + quantity,
  // so tapping Add to cart and then Buy now doesn't silently double the order.
  | { type: "set"; variantId: string; quantity: number; snapshot: CartItemSnapshot }
  | { type: "updateQuantity"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" }
  | { type: "replace"; items: CartItem[] };

export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = items.find((item) => item.variantId === action.variantId);
      if (existing) {
        return items.map((item) =>
          item.variantId === action.variantId
            ? { ...item, quantity: item.quantity + action.quantity, snapshot: action.snapshot }
            : item,
        );
      }
      return [
        ...items,
        { variantId: action.variantId, quantity: action.quantity, snapshot: action.snapshot },
      ];
    }
    case "set": {
      const rest = items.filter((item) => item.variantId !== action.variantId);
      if (action.quantity <= 0) return rest;
      const line = { variantId: action.variantId, quantity: action.quantity, snapshot: action.snapshot };
      const index = items.findIndex((item) => item.variantId === action.variantId);
      return index === -1 ? [...items, line] : items.map((item, i) => (i === index ? line : item));
    }
    case "updateQuantity": {
      if (action.quantity <= 0) {
        return items.filter((item) => item.variantId !== action.variantId);
      }
      return items.map((item) =>
        item.variantId === action.variantId ? { ...item, quantity: action.quantity } : item,
      );
    }
    case "remove":
      return items.filter((item) => item.variantId !== action.variantId);
    case "clear":
      return [];
    case "replace":
      return action.items;
    default:
      return items;
  }
}
