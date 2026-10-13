import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { BUSINESS, businessDisplayName } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Peculiar about an order, delivery, refunds or anything else.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const businessRows = [
    BUSINESS.legalName ? { label: "Registered name", value: BUSINESS.legalName } : null,
    BUSINESS.proprietorName ? { label: "Proprietor", value: BUSINESS.proprietorName } : null,
    BUSINESS.address ? { label: "Address", value: BUSINESS.address } : null,
    BUSINESS.gstin ? { label: "GSTIN", value: BUSINESS.gstin } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <LegalPage
      title="Contact Us"
      current="/contact"
      intro="Questions about an order, delivery, a refund or our products? We're happy to help."
    >
      <h2>Get in touch</h2>
      <ul>
        <li>
          <strong>Email:</strong> <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
        <li>
          <strong>Phone:</strong> <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>
        </li>
      </ul>
      <p>
        For anything about an order, please include your order number (it starts with &ldquo;PEC-&rdquo;). You
        can find it in your confirmation and under <Link href="/account/orders">My orders</Link>.
      </p>

      {businessRows.length > 0 ? (
        <>
          <h2>Business details</h2>
          <p>{businessDisplayName()}</p>
          <ul>
            {businessRows.map((row) => (
              <li key={row.label}>
                <strong>{row.label}:</strong> {row.value}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>Grievance Officer</h2>
      <p>
        If you have a complaint about an order or about how we handle your personal information, contact our
        Grievance Officer{BUSINESS.proprietorName ? `, ${BUSINESS.proprietorName},` : ""} at{" "}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or{" "}
        <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>. We acknowledge complaints within 48 hours
        and aim to resolve them within one month, as required by the Consumer Protection (E-Commerce) Rules,
        2020.
      </p>

      <h2>Our policies</h2>
      <ul>
        <li><Link href="/shipping-policy">Shipping &amp; Delivery Policy</Link></li>
        <li><Link href="/refund-policy">Cancellation &amp; Refund Policy</Link></li>
        <li><Link href="/terms">Terms &amp; Conditions</Link></li>
        <li><Link href="/privacy">Privacy Policy</Link></li>
      </ul>
    </LegalPage>
  );
}
