"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api/client";
import { getMyOrder } from "@/lib/api/orders";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import type { Order } from "@/types/api";
import { OrderDetailCard } from "./OrderDetailCard";

type LoadState = "loading" | "found" | "unavailable" | "error";

export function OrderConfirmationClient({ orderId }: { orderId: string }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    // Prefer the copy stashed right after checkout — avoids a round trip for
    // the common case of landing here right after paying.
    const stashed = sessionStorage.getItem(`peculiar:order:${orderId}`);
    if (stashed) {
      try {
        // sessionStorage only exists client-side, so this can only run
        // post-mount — a deliberate one-time read, not a render loop.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrder(JSON.parse(stashed) as Order);
        setState("found");
        return;
      } catch {
        // Corrupt stash — fall through to the server lookup below.
      }
    }

    if (isAuthLoading) return;

    if (!user) {
      // Sign-in is required to check out, so this means the session lapsed
      // between paying and landing here, or the sessionStorage stash was
      // lost (different browser/device). Prompt to sign back in rather than
      // dead-ending — see the "unavailable" state's Sign in link below.
      setState("unavailable");
      return;
    }

    let cancelled = false;
    getMyOrder(orderId)
      .then((fetched) => {
        if (!cancelled) {
          setOrder(fetched);
          setState("found");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(err instanceof ApiError && err.status === 404 ? "unavailable" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, user, isAuthLoading]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Skeleton className="mb-4 h-8 w-1/2" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Couldn't load your order"
          description="Please try again in a moment."
        />
      </div>
    );
  }

  if (state === "unavailable" || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Sign in to view this order"
          description="You'll need to be signed in to the account you ordered with — it'll show up in your order history once you are."
          action={
            <Link href={`/login?next=/order-confirmation/${orderId}`} className={buttonClassName()}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-caption mb-2">Order confirmed</p>
      <h1 className="text-heading-1 mb-2">Thank you!</h1>
      <p className="text-body text-muted-foreground mb-8">
        Your order <strong>{order.orderNumber}</strong> is{" "}
        {ORDER_STATUS_LABEL[order.status].toLowerCase()}.
        {order.customerEmail ? " We'll email you updates." : ""}
      </p>

      <OrderDetailCard order={order} />

      <div className="mt-8">
        <Link href="/" className={buttonClassName({ variant: "secondary" })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
