import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Where we deliver, delivery charges, timelines and packaging for Peculiar orders.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  const { dispatchTime, deliveryTime } = BUSINESS.shipping;
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      current="/shipping-policy"
      intro={`We deliver ${BUSINESS.brandName} orders across ${BUSINESS.shipping.coverage}.`}
    >
      <h2>Where we deliver</h2>
      <p>We ship to addresses across {BUSINESS.shipping.coverage}. Remote locations may take a little longer to reach.</p>

      <h2>Delivery charges</h2>
      <p>
        A delivery charge may apply to your order. Any delivery charge is shown in your order summary at
        checkout, before you pay, and is included in the total you pay. There are no other charges after
        checkout.
      </p>

      <h2>Dispatch and delivery times</h2>
      {dispatchTime ? <p>Orders are usually dispatched within {dispatchTime} of a successful payment.</p> : null}
      {deliveryTime ? <p>Once dispatched, orders usually arrive within {deliveryTime}, depending on your location.</p> : null}
      {!dispatchTime && !deliveryTime ? (
        <p>Delivery time depends on your location. We dispatch paid orders as quickly as we can.</p>
      ) : null}
      <p>
        We keep you updated on WhatsApp as your order is confirmed, dispatched and delivered, and you can check
        your order&apos;s status at any time under <Link href="/account/orders">My orders</Link>.
      </p>

      <h2>Packaging</h2>
      <p>
        Every order ships in a plain outer box that doesn&apos;t show what&apos;s inside, and each pad is
        individually wrapped.
      </p>

      <h2>Your delivery details</h2>
      <p>
        Please make sure your address, PIN code and phone number are correct at checkout; the courier may call
        you to complete delivery. If you notice a mistake, contact us straight away, before your order is
        dispatched, and we&apos;ll update it.
      </p>

      <h2>Damaged or wrong items</h2>
      <p>
        If your order arrives damaged or isn&apos;t what you ordered, tell us within {BUSINESS.issueReportDays}{" "}
        days of delivery. See our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.
      </p>

      <ContactLine />
    </LegalPage>
  );
}
