"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  AddressForm,
  type AddressFormValues,
  EMPTY_ADDRESS_FORM_VALUES,
} from "@/components/checkout/AddressForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { createOrder } from "@/lib/api/orders";
import { listProducts } from "@/lib/api/products";
import { verifyPayment } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { formatPaise } from "@/lib/money";
import { openRazorpayCheckout, type RazorpaySuccessResponse } from "@/lib/razorpay";
import { checkoutFormSchema } from "@/lib/validation/order";
import type { Order, Product } from "@/types/api";

interface CartIssue {
  variantId: string;
  kind: "unavailable" | "insufficient-stock" | "price-changed";
  message: string;
}

// Dev/test only — see PAYMENTS_MOCK in docs/decisions.md. When true, the real
// Razorpay widget (which needs a real key_id and a real order it signed) is
// never opened; a "simulate payment" button drives the same verify/confirm
// path instead.
const isPaymentsMock = process.env.NEXT_PUBLIC_PAYMENTS_MOCK === "true";

export function CheckoutClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, isHydrated, subtotalInPaise, clear } = useCart();

  const [values, setValues] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const [liveProducts, setLiveProducts] = useState<Product[] | null>(null);
  const [isReconciling, setIsReconciling] = useState(true);

  // Pre-fill email for a logged-in customer — derived at render time rather
  // than synced via an effect+setState, so once the user actually types
  // something their input always wins.
  const emailValue = values.customerEmail || user?.email || "";

  // Empty cart shouldn't land here directly — but never redirect away once
  // an order has actually been created (cart gets cleared on success).
  useEffect(() => {
    if (isHydrated && items.length === 0 && !order) {
      router.replace("/");
    }
  }, [isHydrated, items.length, order, router]);

  // Re-verify the cart against live catalog state before allowing checkout —
  // never trust the localStorage snapshot for price/availability.
  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((products) => {
        if (!cancelled) setLiveProducts(products);
      })
      .catch(() => {
        // Reconciliation is a courtesy check, not the source of truth — the
        // API re-validates everything at order creation regardless.
      })
      .finally(() => {
        if (!cancelled) setIsReconciling(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const issues: CartIssue[] = [];
  if (liveProducts) {
    const liveByVariantId = new Map<string, { variant: Product["variants"][number]; product: Product }>();
    for (const product of liveProducts) {
      for (const variant of product.variants) {
        liveByVariantId.set(variant.id, { variant, product });
      }
    }
    for (const item of items) {
      const found = liveByVariantId.get(item.variantId);
      if (!found || !found.variant.isActive || !found.product.isActive) {
        issues.push({
          variantId: item.variantId,
          kind: "unavailable",
          message: `${item.snapshot.productName} (${item.snapshot.variantLabel}) is no longer available.`,
        });
        continue;
      }
      if (found.variant.stock < item.quantity) {
        issues.push({
          variantId: item.variantId,
          kind: "insufficient-stock",
          message: `Only ${found.variant.stock} left of ${item.snapshot.productName} (${item.snapshot.variantLabel}) — reduce the quantity in your cart.`,
        });
      }
      if (found.variant.priceInPaise !== item.snapshot.priceInPaise) {
        issues.push({
          variantId: item.variantId,
          kind: "price-changed",
          message: `The price for ${item.snapshot.productName} (${item.snapshot.variantLabel}) is now ${formatPaise(found.variant.priceInPaise)}.`,
        });
      }
    }
  }
  const hasBlockingIssues = issues.some((issue) => issue.kind !== "price-changed");

  function handleFieldChange(field: keyof AddressFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function openWidgetFor(currentOrder: Order) {
    const payment = currentOrder.payments[0];
    if (!payment?.providerOrderId) {
      setFormError("Payment could not be started. Please contact support.");
      return;
    }
    void openRazorpayCheckout({
      providerOrderId: payment.providerOrderId,
      amountInPaise: currentOrder.totalInPaise,
      customerName: currentOrder.customerName,
      customerEmail: currentOrder.customerEmail ?? undefined,
      customerPhone: currentOrder.customerPhone,
      onSuccess: (response) => void handlePaymentSuccess(currentOrder, response),
      onDismiss: () => {
        // Order stays 'pending' — the "Retry payment" button reopens the
        // same widget against the same order, no new order is created.
      },
    });
  }

  async function handleMockPayment(pendingOrder: Order) {
    const payment = pendingOrder.payments[0];
    if (!payment?.providerOrderId) {
      setFormError("Payment could not be started. Please contact support.");
      return;
    }
    await handlePaymentSuccess(pendingOrder, {
      razorpay_order_id: payment.providerOrderId,
      razorpay_payment_id: `mock_payment_${crypto.randomUUID()}`,
      razorpay_signature: "mock",
    });
  }

  async function handlePaymentSuccess(
    pendingOrder: Order,
    response: RazorpaySuccessResponse,
  ) {
    try {
      const verified = await verifyPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      sessionStorage.setItem(`peculiar:order:${verified.id}`, JSON.stringify(verified));
      clear();
      router.push(`/order-confirmation/${verified.id}`);
    } catch {
      setFormError(
        `Payment was received but we couldn't confirm it automatically. Please contact support with your order number: ${pendingOrder.orderNumber}.`,
      );
    }
  }

  async function handlePlaceOrder(event: FormEvent) {
    event.preventDefault();
    if (hasBlockingIssues || isSubmitting) return;

    const parsed = checkoutFormSchema.safeParse({
      customerName: values.customerName,
      customerEmail: emailValue || undefined,
      customerPhone: values.customerPhone,
      shippingAddress: {
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: "IN",
      },
    });

    if (!parsed.success) {
      const errors: Partial<Record<keyof AddressFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[issue.path.length - 1] as keyof AddressFormValues;
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    // A fresh key per explicit submit click — the disabled button (set
    // synchronously above) is what prevents a genuine accidental
    // double-submit; a *stable* per-page-load key would incorrectly reject
    // a legitimate retry after fixing a validation/stock error, since the
    // resubmitted payload would differ from the failed attempt.
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const created = await createOrder(
        {
          ...parsed.data,
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        },
        idempotencyKey,
      );
      setOrder(created);
      if (!isPaymentsMock) {
        openWidgetFor(created);
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isHydrated || (items.length === 0 && !order)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-heading-1 mb-8">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {!isReconciling && issues.length > 0 ? (
            <div className="border-danger/30 bg-danger/5 rounded-lg border p-4">
              <ul className="text-caption flex flex-col gap-1">
                {issues.map((issue) => (
                  <li key={`${issue.variantId}-${issue.kind}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {order ? (
            <div className="border-border bg-surface rounded-lg border p-5">
              <p className="text-body font-medium">Order {order.orderNumber} created.</p>
              <p className="text-caption mt-1">
                {isPaymentsMock
                  ? "Payments are in mock mode — simulate a successful payment to confirm it."
                  : "Complete your payment to confirm it — the order is held for you in the meantime."}
              </p>
              {isPaymentsMock ? (
                <Button className="mt-4" onClick={() => void handleMockPayment(order)}>
                  Simulate successful payment
                </Button>
              ) : (
                <Button className="mt-4" onClick={() => openWidgetFor(order)}>
                  Retry payment
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
              <AddressForm
                values={{ ...values, customerEmail: emailValue }}
                errors={fieldErrors}
                onChange={handleFieldChange}
              />
              {formError ? <p className="text-danger text-sm">{formError}</p> : null}
              <Button type="submit" disabled={isSubmitting || hasBlockingIssues}>
                {isSubmitting ? "Placing order…" : "Place order"}
              </Button>
            </form>
          )}
        </div>

        <div>
          <OrderSummary items={items} subtotalInPaise={subtotalInPaise} />
        </div>
      </div>
    </div>
  );
}
