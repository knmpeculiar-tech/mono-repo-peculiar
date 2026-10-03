export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
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
  /** Razorpay's order id — Order.payments[0].providerOrderId from the API. */
  providerOrderId: string;
  amountInPaise: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  /** Widget closed without completing payment — the order stays 'pending'. */
  onDismiss?: () => void;
}

export async function openRazorpayCheckout(params: OpenRazorpayCheckoutParams): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout script did not load correctly");
  }

  const razorpay = new window.Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
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

  razorpay.open();
}
