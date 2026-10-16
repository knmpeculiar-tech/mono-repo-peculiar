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
import { formatIST } from "@/lib/date";
import { formatPaise } from "@/lib/money";
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

  return <OrderPlaced order={order} />;
}

const NEXT_STEPS = [
  { title: "Order confirmed", detail: "Payment received and your order is in our system." },
  { title: "Packed and dispatched", detail: "We pack it in discreet, plain packaging and hand it to the courier." },
  { title: "Delivered", detail: "It arrives at your door. Your order history shows each step." },
];

function OrderPlaced({ order }: { order: Order }) {
  // A verified checkout lands here as "confirmed", but a payment that is still
  // settling arrives as "pending": don't show a green "paid" until it is.
  const isPaid = order.status !== "pending" && order.status !== "cancelled";
  const firstName = order.customerName.trim().split(/\s+/)[0];
  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <section
        className={`rounded-3xl px-6 py-10 text-center sm:px-10 ${
          isPaid ? "bg-success/8 border-success/20 border" : "bg-surface-muted"
        }`}
      >
        <div
          aria-hidden="true"
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full motion-safe:animate-[dialog-in_400ms_ease-out] ${
            isPaid ? "bg-success text-success-foreground" : "bg-border text-foreground"
          }`}
        >
          {isPaid ? (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          )}
        </div>
        <p className={`mt-5 text-xs font-semibold tracking-[0.14em] uppercase ${isPaid ? "text-success" : "text-muted-foreground"}`}>
          {isPaid ? "Payment successful" : "Confirming your payment"}
        </p>
        <h1 className="text-heading-1 mt-2">
          {isPaid ? `Thank you, ${firstName}!` : "Almost there"}
        </h1>
        <p className="text-body text-muted-foreground mx-auto mt-3 max-w-md">
          {isPaid
            ? "Your order is confirmed and we're getting it ready."
            : "We're waiting for the bank to confirm your payment. This usually takes a few minutes; your order history will update on its own."}
        </p>

        <dl className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="bg-surface rounded-2xl px-4 py-3">
            <dt className="text-caption">Order number</dt>
            <dd className="mt-0.5 font-semibold">{order.orderNumber}</dd>
          </div>
          <div className="bg-surface rounded-2xl px-4 py-3">
            <dt className="text-caption">{isPaid ? "Amount paid" : "Order total"}</dt>
            <dd className="mt-0.5 font-semibold">{formatPaise(order.totalInPaise)}</dd>
          </div>
          <div className="bg-surface rounded-2xl px-4 py-3">
            <dt className="text-caption">Placed on</dt>
            <dd className="mt-0.5 text-sm font-semibold">{formatIST(order.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-5">
        <section aria-labelledby="next-heading" className="md:col-span-3">
          <h2 id="next-heading" className="text-heading-3">
            What happens next
          </h2>
          <ol className="mt-5">
            {NEXT_STEPS.map((step, index) => {
              const done = index === 0 && isPaid;
              const last = index === NEXT_STEPS.length - 1;
              return (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last ? (
                    <span
                      aria-hidden="true"
                      className={`absolute top-8 bottom-0 left-[13px] w-0.5 ${done ? "bg-success/40" : "bg-border"}`}
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-success text-success-foreground" : "border-border text-muted-foreground border bg-white"
                    }`}
                  >
                    {done ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="pt-0.5">
                    <p className="font-medium">
                      {step.title}
                      {done ? <span className="sr-only"> (done)</span> : null}
                    </p>
                    <p className="text-caption mt-0.5">
                      {index === 0 && !isPaid
                        ? "Your order is placed; this ticks once the payment is confirmed."
                        : step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="border-border text-body mt-6 rounded-2xl border px-4 py-3 text-sm">
            We&apos;ll send updates on WhatsApp to{" "}
            <strong className="font-semibold">{order.customerPhone}</strong>.
          </p>
        </section>

        <div className="flex flex-col gap-6 md:col-span-2">
          <OrderDetailCard order={order} />
          <section aria-labelledby="address-heading" className="border-border rounded-lg border p-5">
            <h2 id="address-heading" className="text-heading-3 mb-3 text-lg">
              Delivering to
            </h2>
            <address className="text-body text-muted-foreground text-sm not-italic">
              <span className="text-foreground block font-medium">{order.customerName}</span>
              {address.line1}
              {address.line2 ? <>, {address.line2}</> : null}
              <br />
              {address.city}, {address.state} {address.postalCode}
            </address>
          </section>
        </div>
      </div>

      <div className="border-border mt-10 flex flex-col items-start gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Link href={`/account/orders/${order.id}`} className={buttonClassName()}>
            Track this order
          </Link>
          <Link href="/" className={buttonClassName({ variant: "secondary" })}>
            Continue shopping
          </Link>
        </div>
        <p className="text-caption">
          Questions?{" "}
          <Link href="/contact" className="text-brand font-medium hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
