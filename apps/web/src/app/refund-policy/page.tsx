import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "How to cancel a Peculiar order, what qualifies for a replacement or refund, and refund timelines.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  const days = BUSINESS.issueReportDays;
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      current="/refund-policy"
      intro="Sanitary pads are hygiene products, so our policy is built around getting your order to you in perfect condition."
    >
      <h2>Cancelling an order</h2>
      <p>
        You can cancel your order at any time <strong>before it is dispatched</strong>, and you&apos;ll get a{" "}
        <strong>full refund</strong> to your original payment method. To cancel, contact us with your order
        number (it starts with &ldquo;PEC-&rdquo;). Once an order has been dispatched, it can no longer be
        cancelled.
      </p>

      <h2>Returns</h2>
      <p>
        For hygiene reasons, we can&apos;t accept returns of products that have been opened or used, or that you
        no longer want.
      </p>

      <h2>Damaged, defective or wrong items</h2>
      <p>
        If your order arrives damaged, a product is defective, or you received the wrong item, tell us within{" "}
        <strong>{days} days of delivery</strong>. Please include your order number and a photo of the product
        and packaging. Once we&apos;ve confirmed the problem, we&apos;ll send you a replacement or refund you.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds are made to the payment method you used at checkout (UPI, card or netbanking), through
        our payment partner Razorpay. After a refund is initiated, it usually takes 5–7 business days to appear
        in your account, depending on your bank.
      </p>

      <h2>Payment deducted but no order?</h2>
      <p>
        If money was taken from your account but you didn&apos;t receive an order confirmation, contact us with
        the payment details and we&apos;ll either confirm your order or refund the payment in full.
      </p>

      <ContactLine />
    </LegalPage>
  );
}
