import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/legal/LegalPage";
import { BUSINESS, businessDisplayName } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you use the Peculiar website and buy from us.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      current="/terms"
      intro="These terms apply when you use this website or place an order with us. By using the site, you agree to them."
    >
      <h2>1. Who we are</h2>
      <p>
        This website is operated by {businessDisplayName()}
        {BUSINESS.proprietorName ? `, a proprietorship of ${BUSINESS.proprietorName}` : ""}
        {BUSINESS.address ? `, ${BUSINESS.address}` : ""}. &ldquo;We&rdquo;, &ldquo;us&rdquo; and
        &ldquo;our&rdquo; refer to {BUSINESS.brandName}.
      </p>

      <h2>2. Your account</h2>
      <p>
        You need an account to place an order. Please give accurate details and keep your password private:
        you&apos;re responsible for activity on your account. If you&apos;re under 18, please use the site with
        a parent or guardian&apos;s involvement.
      </p>

      <h2>3. Products and prices</h2>
      <p>
        We describe our products as accurately as we can. Prices are in Indian Rupees (₹), and the amount you
        pay is the total shown at checkout, including any delivery charge. Prices may change, but a change
        never affects an order you&apos;ve already paid for.
      </p>

      <h2>4. Orders and payment</h2>
      <p>
        Your order is confirmed once your payment is successful. Payments are processed securely by our
        payment partner Razorpay; we never see or store your card or UPI details. We may cancel an order, with
        a full refund, if an item is out of stock, a price was listed in error, or we suspect fraud.
      </p>

      <h2>5. Delivery, cancellations and refunds</h2>
      <p>
        Delivery is covered by our <Link href="/shipping-policy">Shipping &amp; Delivery Policy</Link>, and
        cancellations, damaged or wrong items and refunds by our{" "}
        <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>. Both form part of these terms.
      </p>

      <h2>6. Using our products</h2>
      <p>
        Each pad is for single use. If you experience irritation or discomfort, stop using the product and
        consult a doctor. Information on this website, including our blog, is general information and not
        medical advice.
      </p>

      <h2>7. Our content</h2>
      <p>
        The {BUSINESS.brandName} name, logo, images and text on this website belong to us. Please don&apos;t
        copy or reuse them without our written permission.
      </p>

      <h2>8. Liability</h2>
      <p>
        To the extent permitted by law, our total liability for any claim relating to an order is limited to
        the amount you paid for that order. Nothing in these terms limits your rights under the Consumer
        Protection Act, 2019 or any other law that can&apos;t be excluded.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the
        courts at Delhi.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these terms from time to time. The date at the top of this page shows when they last
        changed; the version in effect when you place an order applies to that order.
      </p>

      <ContactLine />
    </LegalPage>
  );
}
