import { describe, expect, it } from "vitest";
import { cartReducer, type CartItem, type CartItemSnapshot } from "./cartReducer";

const snapshot: CartItemSnapshot = {
  productSlug: "pads",
  productName: "Pads",
  variantLabel: "Medium - Regular Pack",
  priceInPaise: 25000,
  imageUrl: null,
};

const otherSnapshot: CartItemSnapshot = {
  ...snapshot,
  variantLabel: "Large - Jumbo Pack",
  priceInPaise: 40000,
};

describe("cartReducer", () => {
  it("adds a new item", () => {
    const result = cartReducer([], { type: "add", variantId: "v1", quantity: 2, snapshot });
    expect(result).toEqual<CartItem[]>([{ variantId: "v1", quantity: 2, snapshot }]);
  });

  it("merges quantity when adding an existing variant again", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 2, snapshot }];
    const result = cartReducer(initial, { type: "add", variantId: "v1", quantity: 3, snapshot });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it("keeps separate line items for different variants", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 1, snapshot }];
    const result = cartReducer(initial, {
      type: "add",
      variantId: "v2",
      quantity: 1,
      snapshot: otherSnapshot,
    });
    expect(result).toHaveLength(2);
  });

  it("updates quantity for an existing item", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 2, snapshot }];
    const result = cartReducer(initial, { type: "updateQuantity", variantId: "v1", quantity: 5 });
    expect(result[0].quantity).toBe(5);
  });

  it("removes the item when quantity is set to zero or below", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 2, snapshot }];
    const result = cartReducer(initial, { type: "updateQuantity", variantId: "v1", quantity: 0 });
    expect(result).toEqual([]);
  });

  it("removes an item", () => {
    const initial: CartItem[] = [
      { variantId: "v1", quantity: 1, snapshot },
      { variantId: "v2", quantity: 1, snapshot: otherSnapshot },
    ];
    const result = cartReducer(initial, { type: "remove", variantId: "v1" });
    expect(result).toEqual([{ variantId: "v2", quantity: 1, snapshot: otherSnapshot }]);
  });

  it("clears the cart", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 1, snapshot }];
    expect(cartReducer(initial, { type: "clear" })).toEqual([]);
  });

  it("replaces the cart wholesale", () => {
    const replacement: CartItem[] = [{ variantId: "v9", quantity: 4, snapshot }];
    expect(cartReducer([], { type: "replace", items: replacement })).toEqual(replacement);
  });

  it("set adds a missing line at exactly the given quantity", () => {
    const result = cartReducer([], { type: "set", variantId: "v1", quantity: 3, snapshot });
    expect(result).toEqual<CartItem[]>([{ variantId: "v1", quantity: 3, snapshot }]);
  });

  it("set overwrites an existing line's quantity instead of adding to it, keeping its position", () => {
    const initial: CartItem[] = [
      { variantId: "v1", quantity: 2, snapshot },
      { variantId: "v2", quantity: 1, snapshot: otherSnapshot },
    ];
    const result = cartReducer(initial, { type: "set", variantId: "v1", quantity: 1, snapshot });
    expect(result).toEqual<CartItem[]>([
      { variantId: "v1", quantity: 1, snapshot },
      { variantId: "v2", quantity: 1, snapshot: otherSnapshot },
    ]);
  });

  it("set to zero removes the line", () => {
    const initial: CartItem[] = [{ variantId: "v1", quantity: 2, snapshot }];
    expect(cartReducer(initial, { type: "set", variantId: "v1", quantity: 0, snapshot })).toEqual([]);
  });
});
