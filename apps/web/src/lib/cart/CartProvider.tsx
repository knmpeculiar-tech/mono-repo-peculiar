"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import { cartReducer, type CartItem, type CartItemSnapshot } from "./cartReducer";

const STORAGE_KEY = "peculiar:cart:v1";

interface CartContextValue {
  items: CartItem[];
  /** False until the client has read localStorage — avoids an SSR/CSR mismatch. */
  isHydrated: boolean;
  add: (variantId: string, quantity: number, snapshot: CartItemSnapshot) => void;
  /** Puts the line at exactly `quantity` (adding it if absent) — used by Buy now. */
  set: (variantId: string, quantity: number, snapshot: CartItemSnapshot) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  subtotalInPaise: number;
  // Lives here rather than in Header so the product page can open the drawer
  // right after Add to cart, as confirmation with a Checkout button in reach.
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  useEffect(() => {
    dispatch({ type: "replace", items: readStoredCart() });
    // A deliberate one-time hydration guard, not a cascading-render bug:
    // localStorage must not be read during SSR/first render (mismatch), so
    // this can only run post-mount, exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  // Cross-tab sync: last write wins, which is fine for one user's own tabs.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      dispatch({ type: "replace", items: readStoredCart() });
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const subtotalInPaise = items.reduce(
    (sum, item) => sum + item.snapshot.priceInPaise * item.quantity,
    0,
  );

  const value: CartContextValue = {
    items,
    isHydrated,
    add: (variantId, quantity, snapshot) =>
      dispatch({ type: "add", variantId, quantity, snapshot }),
    set: (variantId, quantity, snapshot) =>
      dispatch({ type: "set", variantId, quantity, snapshot }),
    updateQuantity: (variantId, quantity) => dispatch({ type: "updateQuantity", variantId, quantity }),
    remove: (variantId) => dispatch({ type: "remove", variantId }),
    clear: () => dispatch({ type: "clear" }),
    subtotalInPaise,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
