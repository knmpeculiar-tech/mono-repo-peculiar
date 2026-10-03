"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { CartDrawer } from "./CartDrawer";
import { Logo } from "./Logo";

export function Header() {
  const { items, isHydrated, isDrawerOpen, openDrawer, closeDrawer } = useCart();
  const { user, signOut } = useAuth();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="border-border bg-surface/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Peculiar home" className="text-foreground -my-1 py-1">
            <Logo className="w-28 sm:w-32" />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
            <Link href="/about" className="text-body hover:text-brand hidden sm:inline">
              About
            </Link>
            <Link href="/blog" className="text-body hover:text-brand">
              Blog
            </Link>
            {user ? (
              <>
                <Link href="/account/orders" className="text-body hover:text-brand hidden sm:inline">
                  My orders
                </Link>
                <button type="button" onClick={() => signOut()} className="text-body hover:text-brand">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="text-body hover:text-brand">
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className="hover:bg-surface-muted relative rounded-md p-2"
            >
              <CartIcon />
              {isHydrated && itemCount > 0 ? (
                <span className="bg-brand text-brand-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </nav>
        </div>
      </header>
      <CartDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <path
        d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
