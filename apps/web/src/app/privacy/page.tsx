import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/legal/LegalPage";
import { BUSINESS, businessDisplayName } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal information Peculiar collects, why, who it's shared with, and your rights.",
  alternates: { canonical: "/privacy" },
};

// Describes what the system actually does (Supabase auth/DB, Razorpay
// checkout, cookieless Vercel analytics, WhatsApp order updates). Update it
// whenever a new service starts receiving customer data.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      current="/privacy"
      intro={`This policy explains what personal information ${businessDisplayName()} collects when you use this website, why we collect it, and how we protect it.`}
    >
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address and password. Passwords are stored only in encrypted (hashed) form by our login provider; we can&apos;t see them.</li>
        <li><strong>Order details:</strong> your name, phone number, delivery address, the products you order and your order history.</li>
        <li><strong>Payment details:</strong> handled entirely by our payment partner Razorpay. We receive only the payment reference and whether it succeeded, never your card, UPI or bank details.</li>
        <li><strong>Website usage:</strong> anonymous, aggregated statistics such as page views and page-load speed. This uses no cookies and doesn&apos;t identify you, and we don&apos;t collect it on account pages.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To process, deliver and support your orders, including order updates by WhatsApp, phone or email.</li>
        <li>To manage your account and keep it secure.</li>
        <li>To prevent fraud and meet our legal, tax and accounting obligations.</li>
        <li>To understand how the website is used, so we can improve it.</li>
      </ul>
      <p>We don&apos;t sell your personal information, and we don&apos;t use it for third-party advertising.</p>

      <h2>Who we share it with</h2>
      <p>Only the service providers we need to run the shop, and only what each one needs:</p>
      <ul>
        <li><strong>Supabase:</strong> our database and login provider (stores your account and orders).</li>
        <li><strong>Razorpay:</strong> processes your payment.</li>
        <li><strong>Vercel and Hostinger:</strong> host this website and its server.</li>
        <li><strong>Courier partners:</strong> receive your name, phone number and address to deliver your order.</li>
        <li><strong>Email providers:</strong> deliver account emails, such as sign-up confirmation and password reset.</li>
      </ul>
      <p>We may also disclose information where the law requires it.</p>

      <h2>Cookies and local storage</h2>
      <p>
        We use only what the site needs to work: a login cookie that keeps you signed in, and your browser&apos;s
        local storage to remember your cart. We don&apos;t use advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account details while your account is active, and order records for as long as the law
        requires us to keep business records. If you delete your account, we delete or anonymise your
        personal information except where we must keep it by law.
      </p>

      <h2>Security</h2>
      <p>
        All traffic to this website is encrypted (HTTPS), and access to customer data is restricted to the
        people and services that need it to fulfil your orders.
      </p>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask to see the personal
        information we hold about you, correct or update it, or have it deleted, and you can withdraw your
        consent at any time. To make a request or raise a concern, contact us using the details below
        {BUSINESS.proprietorName ? `; our Grievance Officer is ${BUSINESS.proprietorName}` : ""}. We&apos;ll
        respond as quickly as we can and within the time the law requires.
      </p>

      <h2>Changes to this policy</h2>
      <p>If we change how we handle your information, we&apos;ll update this page and the date at the top.</p>

      <ContactLine />
    </LegalPage>
  );
}
