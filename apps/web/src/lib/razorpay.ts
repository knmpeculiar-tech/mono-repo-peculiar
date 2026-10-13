export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Shape of Razorpay's `payment.failed` event (fields Razorpay may omit are optional). */
export interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only be opened in the browser"));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the Razorpay checkout script"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export interface OpenRazorpayCheckoutParams {
  /** From the API's create-order response (checkout.keyId) — the same key that created the order. */
  keyId: string;
  /** Razorpay's order id — Order.payments[0].providerOrderId from the API. */
  providerOrderId: string;
  amountInPaise: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  /** Widget closed without completing payment — the order stays 'pending'. */
  onDismiss?: () => void;
  /**
   * A payment attempt failed (declined card, failed UPI, …). Razorpay keeps its
   * window open so the customer can retry; this is for telling them why.
   */
  onFailure?: (message: string) => void;
}

const GENERIC_FAILURE = "The payment didn't go through";

export function paymentFailureMessage(response: RazorpayFailureResponse): string {
  return response.error?.description?.trim() || GENERIC_FAILURE;
}

export async function openRazorpayCheckout(params: OpenRazorpayCheckoutParams): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script did not load correctly");
  }

  const razorpay = new window.Razorpay({
    key: params.keyId,
    amount: params.amountInPaise,
    currency: "INR",
    order_id: params.providerOrderId,
    name: "Peculiar",
    prefill: {
      name: params.customerName,
      email: params.customerEmail,
      contact: params.customerPhone,
    },
    // The widget is Razorpay's own iframe with its own theming API — this is
    // the one legitimate place the raw brand hex appears outside CSS tokens.
    theme: { color: "#741C47" },
    handler: params.onSuccess,
    modal: { ondismiss: params.onDismiss },
  });

  // Registered before open() so no failure event can be missed.
  razorpay.on("payment.failed", (response) => params.onFailure?.(paymentFailureMessage(response)));
  razorpay.open();
}
