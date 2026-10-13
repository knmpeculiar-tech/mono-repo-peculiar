import Link from "next/link";
import { POLICY_LINKS } from "@/components/legal/LegalPage";

// Policy links on every page: customers expect them, and payment gateways
// (Razorpay) check for them during website verification.
export function Footer() {
  return (
    <footer className="border-border mt-16 border-t">
      <div className="text-caption mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Peculiar. All rights reserved.</p>
          <nav className="flex gap-5" aria-label="Footer">
            <Link href="/#shop" className="hover:text-brand">
              Shop
            </Link>
            <Link href="/about" className="hover:text-brand">
              About
            </Link>
            <Link href="/blog" className="hover:text-brand">
              Blog
            </Link>
          </nav>
        </div>
        <nav aria-label="Policies">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
