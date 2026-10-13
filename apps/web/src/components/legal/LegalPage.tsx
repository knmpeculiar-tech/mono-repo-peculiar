import Link from "next/link";
import type { ReactNode } from "react";
import { BUSINESS } from "@/lib/businessInfo";

export const POLICY_LINKS = [
  { href: "/shipping-policy", label: "Shipping & Delivery" },
  { href: "/refund-policy", label: "Cancellation & Refunds" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact Us" },
] as const;

// Shared shell for the Contact and policy pages: title, last-updated date,
// readable prose, and links to the other policies (reviewers — Razorpay's
// included — and customers expect to move between them).
export function LegalPage({
  title,
  current,
  intro,
  children,
}: {
  title: string;
  current: (typeof POLICY_LINKS)[number]["href"];
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-heading-1">{title}</h1>
      <p className="text-caption mt-2">Last updated {BUSINESS.policiesUpdated}</p>
      {intro ? <p className="text-body text-muted-foreground mt-6 text-lg">{intro}</p> : null}
      <div className="prose prose-headings:font-display prose-headings:text-foreground prose-a:text-brand mt-8 max-w-none">
        {children}
      </div>
      <nav aria-label="Other policies" className="border-border mt-12 border-t pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {POLICY_LINKS.filter((link) => link.href !== current).map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-brand underline-offset-4 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** "email or call" line used at the end of every policy. */
export function ContactLine() {
  return (
    <p>
      Questions? Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call{" "}
      <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>, or see our{" "}
      <Link href="/contact">contact page</Link>.
    </p>
  );
}
